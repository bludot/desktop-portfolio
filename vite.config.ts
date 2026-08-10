import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

/*
 * Keep the model worker's entry point out of the tree-shaker's reach.
 *
 * `src/ai/model.worker.ts` imports `browser-ai/worker` for its side effect
 * alone: importing it attaches the message handler, and it exports nothing.
 * That package declares `sideEffects: false` — true of everything in it except
 * this one entry point — so the build was entitled to drop the import and did,
 * emitting a worker chunk of exactly zero bytes. The page then asked a thread
 * that was not listening to load a model, and waited: the chat sat on
 * "Downloading the model…" forever, with nothing logged, because no answer
 * looks exactly like a slow one. Dev serves modules unbundled and never
 * tree-shakes, so this only ever appeared once deployed.
 *
 * The package's own `sideEffects: false` reaches the bundler through module
 * resolution, so that is where it has to be answered — a later `treeshake`
 * option is outranked by it and does nothing.
 */
const workerEntryHasSideEffects = (): Plugin => ({
  name: 'browser-ai-worker-side-effects',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (source !== '@thatcatdev/browser-ai/worker') return null
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
    return resolved && { ...resolved, moduleSideEffects: true }
  },
})

export default defineConfig({
  /* The worker is bundled by a build of its own, which inherits none of the
   * plugins below — hence saying it twice. */
  worker: {
    format: 'es',
    plugins: () => [workerEntryHasSideEffects()],
  },
  plugins: [workerEntryHasSideEffects()],
  build: {
    outDir: fileURLToPath(new URL('dist', import.meta.url)),
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('index.html', import.meta.url)),
      },
    },
  },
})
