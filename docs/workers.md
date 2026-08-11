# Workers

`src/processes/jobs.worker.ts`, `src/processes/jobs.ts`, `src/processes/protocol.ts`

## Spawn, then exec

A browser has no `fork`. What it has is the other half of the pair: a blank
process that is told what to become.

`jobs.worker.ts` is that blank process. It knows how to talk and nothing about
the work. The first call naming a job loads the module for it; everything after
that is dispatch. One thread hosts every job rather than one thread each —
threads are not free, each is a fresh heap and a copy of whatever it imports,
and these jobs are brief and idle between presses, so they make far better
neighbours than tenants.

```
main thread                          jobs thread
-----------                          -----------
job("highlight")
  .call("tokens", [lang, src])  ──▶  load("highlight")   → import("./jobs/highlight")
                                     module.tokens(lang, src, say)
                              ◀──    { kind: "done", value: tree }
fromTokens(tree, src)
  → DOM nodes
```

## The protocol

Two closed unions, both keyed on `kind`, both carrying an `id`. A worker
boundary is the one place where a shape mismatch turns into silence rather than
a type error, so every message is one of these and every reply carries the id it
answers.

**Requests:** `call { job, method, args }`, `cancel { target }`.
**Responses:** `chunk { value }`, `done { value }`, `error { message, name? }`,
`aborted`.

`chunk` is non-terminal — a job may report a hundred times against one id. The
other three end the call and remove it from the pending map.

Ids are allocated by the client and only ever echoed by the worker.

### Two deliberate differences from the model worker next door

The model protocol (in `@thatcatdev/browser-ai`) is the older of the two and
worth reading, but it is model-shaped in ways that do not generalise:

- Its `done` carries four optional model fields (`text`, `vectors`, `device`,
  `fellBack`). Here `done` carries one opaque `value` and the job decides what it
  means.
- Its progress is downloaded **bytes**. Arbitrary work has no bytes to report, so
  `chunk` is opaque too.
- **Its abort is a single module-global boolean**, which silences whatever
  happens to be streaming — including a second caller's answer. Here `cancel`
  names its target, so taking one call back cannot silence another's.

Cancel marks; it does not stop. Nothing can interrupt a function already running
in a JS thread, so what cancel honestly means is "stop telling me", and the
caller gets `aborted` rather than being left to time out.

## Adding a job

1. Write the module under `src/processes/jobs/`. Plain exported functions. It
   may not touch the DOM, and may not import anything that does — that is the
   whole contract. If it wants to report as it goes, take a last argument and
   call it.

2. Register it in `JOBS` in `jobs.worker.ts` as a **literal** dynamic import:

   ```ts
   const JOBS = {
     highlight: () => import("./jobs/highlight"),
   }
   ```

   Literal because that is what a bundler can see. A path assembled from a
   variable is invisible to the build, resolves fine in dev — where modules are
   served as they are asked for — and produces nothing once deployed.

3. Call it: `await job("name").call<Result>("method", [args], { signal, onChunk })`.

4. Add a case to `test/workerBundle.test.ts`. See below for why that is not
   optional.

Naming a job starts nothing. The thread is created by the first actual call.

## Failure is always answered

Every path ends in something usable rather than an exception reaching a window:

- no `Worker` in this environment (jsdom, an old browser)
- the job threw
- the process was killed from the table mid-call
- the thread died

`highlighted()` answers all of them with plain text. The thread is a way of not
stalling, not a dependency — if it cannot be had, the file still opens.

The one exception is a call the caller cancelled, which is re-thrown: that is
their own doing and belongs to them.

## Build constraints — the zero-byte worker

This is the part that will bite, and it has already bitten once.

`src/ai/model.worker.ts` exists only to `import "@thatcatdev/browser-ai/worker"`
for its side effect. That package declares `"sideEffects": false`, so the
production build was entitled to drop the import — and did, emitting a worker
chunk of **exactly zero bytes**. The page then asked a thread that was not
listening to load a model and waited. Nothing failed and nothing was logged,
because no answer looks exactly like a slow one. Dev serves modules unbundled
and never tree-shakes, so it appeared only once deployed.

The fix is in `vite.config.ts`, and two things about it are not obvious:

- The package's `sideEffects: false` reaches the bundler **through module
  resolution**, so that is where it has to be answered. A `treeshake` option is
  outranked by it and does nothing.
- **The worker is bundled by a build of its own, which inherits none of the main
  build's plugins** — so the plugin is registered twice, once in `plugins` and
  once in the `worker.plugins` factory.

So, for any worker entry point:

| Rule | Why |
|---|---|
| A real module under `src/`, referenced as `new Worker(new URL("./x.worker.ts", import.meta.url), { type: "module" })` — written inline and literally | Vite pattern-matches that exact syntactic form to emit the worker. A variable, an alias, or a URL computed elsewhere defeats detection in build only |
| Name it `*.worker.ts` | The emitted asset takes its name from the source basename, and the build test looks for it |
| Keep side-effectful code in the entry file itself | `self.onmessage = …` at the top level is safe. The hazard only exists when an entry is *nothing but* a side-effect import from a `sideEffects: false` package |
| Do not add it to `build.rollupOptions.input` | Workers are discovered through the `new URL` reference and emitted as assets, not as entry chunks |
| Assign the handler synchronously, at the top level | Messages posted before a worker finishes evaluating are queued and delivered. A handler installed after an `await` misses them, silently |
| Add a case to `test/workerBundle.test.ts` | **This is the only check that catches an empty worker.** Typecheck, unit tests and dev all pass with one |

## What the split bought

Moving the highlighter was worth it for a reason that was not the original one.
The stall it removes is real — lowlight walks up to 200KB of source
synchronously, while the window is mid-transition — but the larger win is the
download:

| | before | after |
|---|---|---|
| initial bundle | 484.9 kB (148.8 kB gzip) | 418.6 kB (127.5 kB gzip) |
| grammars | in the main bundle | a 73 kB chunk, fetched when a file is first opened |

That only worked because there is **no synchronous fallback**. Keeping one would
have meant shipping highlight.js twice — which is exactly what the first version
of this did, and the build output is what caught it.

The file is rendered as plain text in the frame it opens and replaced with the
highlighted version when the tokens arrive. Highlighting is decoration; nothing
about reading a file should wait for it.
