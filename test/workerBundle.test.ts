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
describe('the model worker, as built', () => {
  it('keeps the handler that answers the page', async () => {
    const result = (await build({
      configFile: resolve(process.cwd(), 'vite.config.ts'),
      logLevel: 'silent',
      build: { write: false },
    })) as unknown

    // The worker rides along as an emitted asset rather than a chunk, so read
    // whichever of the two shapes it arrives in.
    type Emitted = { fileName: string; code?: string; source?: string | Uint8Array }
    const outputs = (Array.isArray(result) ? result : [result]) as { output: Emitted[] }[]
    const worker = outputs.flatMap((o) => o.output).find((e) => e.fileName.includes('model.worker'))

    expect(worker, 'the build emitted no model worker at all').toBeDefined()

    const code = worker!.code ?? worker!.source?.toString() ?? ''
    // The symptom was an empty file; the cause was the import being dropped, so
    // assert on the thing the import exists to install rather than on a size.
    expect(code).toMatch(/onmessage/)
  }, 120_000)
})
