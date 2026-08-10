/*
 * The thread the models run on.
 *
 * The whole file: importing the package's worker entry point *is* starting it.
 * It exists at all because Vite needs a real module of this app's own to point
 * `new Worker(new URL(...))` at — see `ai/index.ts`, which constructs it.
 */
import "@thatcatdev/browser-ai/worker";
