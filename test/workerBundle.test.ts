import { describe, it, expect } from 'vitest'
import { build } from 'vite'
import { resolve } from 'node:path'

/**
 * The one failure a unit test cannot see: a worker that builds to nothing.
 *
 * `src/ai/model.worker.ts` imports `browser-ai/worker` for its side effect
 * alone — importing it attaches the message handler, and it exports nothing —
 * and that package declares `sideEffects: false`. A production build once took
 * the package at its word, dropped the import, and emitted a worker chunk of
 * exactly zero bytes. Nothing failed. The page asked a thread that was not
 * listening to load a model and waited, so the chat sat on "Downloading the
 * model…" forever, on the deployed site only: dev serves modules unbundled and
 * never tree-shakes, so every check short of a real build said it was fine.
 *
 * Hence a real build. Anything cheaper reproduces the wrong thing.
 */
// The worker rides along as an emitted asset rather than a chunk, so read
// whichever of the two shapes it arrives in.
type Emitted = { fileName: string; code?: string; source?: string | Uint8Array }

/** Build for real, once, and hand back everything it emitted. */
const built = async (): Promise<Emitted[]> => {
  const result = (await build({
    configFile: resolve(process.cwd(), 'vite.config.ts'),
    logLevel: 'silent',
    build: { write: false },
  })) as unknown
  const outputs = (Array.isArray(result) ? result : [result]) as { output: Emitted[] }[]
  return outputs.flatMap((o) => o.output)
}

const codeOf = (emitted: Emitted) => emitted.code ?? emitted.source?.toString() ?? ''

describe('the workers, as built', () => {
  /*
   * Every worker gets a case here, and every new one must. This is the only
   * check that catches an empty thread: typecheck, unit tests and dev all pass
   * with a worker of zero bytes, because dev never bundles and a unit test
   * never asks a bundler anything.
   */
  it.each([
    ['model.worker', /onmessage/],
    ['jobs.worker', /onmessage/],
  ])('keeps the handler that answers the page in %s', async (name, expected) => {
    const emitted = await built()
    const worker = emitted.find((e) => e.fileName.includes(name))

    expect(worker, `the build emitted no ${name} at all`).toBeDefined()

    // The symptom was an empty file; the cause was the import being dropped, so
    // assert on the thing the import exists to install rather than on a size.
    expect(codeOf(worker!)).toMatch(expected)
  }, 120_000)

  /*
   * The jobs worker loads what it is told to become. If the bundler cannot see
   * those dynamic imports it emits a host that can talk and has nothing to say,
   * which fails at the first call rather than at build time.
   */
  it('emits the job modules the host can become', async () => {
    const emitted = await built()
    const names = emitted.map((e) => e.fileName).join(' ')

    expect(names).toMatch(/highlight/)
  }, 120_000)
})
