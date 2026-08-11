# What is deliberately not on a worker

There is one job. That is a conclusion, not a stopping point — this is the
inventory it came from, so the next person to wonder "why isn't X on a worker?"
can find the answer rather than repeat the survey.

## The constraint that shapes everything

**A worker cannot touch the DOM.** So moving an app to a worker never means
moving the app. It means splitting it into a UI half that stays here and a logic
half that goes there, with a message protocol in between. For a window whose
logic is "fetch some JSON and render it", that protocol is the entire cost and
there is no benefit on the other side of it.

The question is therefore never "could this run on a worker" — almost anything
could. It is "is there enough work here to be worth a boundary".

## The survey

| App | Logic it has | Worth moving? |
|---|---|---|
| **projects** | GitHub fetch, cache, backoff; owner/language filtering; language counts; README sanitising; **syntax highlighting** | Highlighting only — see below |
| **chat** | model load and generation, retrieval, grounding, refusals, download progress | No. The expensive half is *already* on a worker; the rest is regex and string assembly |
| **launcher** | an arithmetic parser, four-tier scoring and ranking | No. `math.ts` and `results.ts` are already pure, already tested, sub-millisecond per keystroke |
| **experience** | two date subtractions over 8 records | No |
| **about, alert, app, logger, processes** | none | No |
| **Settings** | one base64 encode, on user action; theme resolution | No — and the theme writes have to be on the main thread anyway |
| **FeatureFlags** | one IndexedDB read and backfill | No |

## Things that look movable and are not

**`src/utils/github.ts`** is the most tempting: 470 lines, zero DOM, cleanly
separated, well tested. But it is `fetch` plus `filter` plus `sort` over about
ninety objects, and the parsing that looks expensive is `JSON.parse` inside the
network stack rather than in our code. Moving it buys nothing and costs a
message protocol — plus a **second IndexedDB connection** to `AppDatabase`,
since the worker would open its own. That is a real concurrency wrinkle traded
for no gain.

**`sanitiseHtml`** uses `DOMParser`, which workers do not have. Moving it means
taking on a JS HTML parser as a dependency to replace a free browser primitive.

**Cosine similarity in the vector search** runs on the main thread inside the
library. About thirty documents at 384 dimensions — nothing.

## The one that was worth it

Syntax highlighting, and it splits cleanly because of an accident of shape:
lowlight returns a **hast tree**, which is plain objects and strings, so it
crosses the boundary without conversion.

- **Tokenising** — walking up to 200KB of source, synchronously, right as the
  file window is animating open — goes to the `highlight` job.
- **Building nodes** stays here, because it needs `document`.

Worth being honest that this is not the whole cost: `build()` emits one element
per token, and that half cannot move. It may well be the more expensive half.

The bigger win turned out to be the download rather than the frame — 73KB of
grammars left the initial bundle and are now fetched only when somebody opens a
file. See [workers](./workers.md#what-the-split-bought).

## The general point

This codebase had already done the separation work that usually motivates a
worker migration. `github.ts`, `view.ts`, `math.ts`, `results.ts`, `progress.ts`,
`suggestions.ts` and `documents.ts` are all DOM-free and unit-tested, and the one
genuinely expensive workload — the models — was moved off the main thread
already.

So the machinery in `src/processes` is built to carry more than it currently
does. Adding a job is cheap. Adding one that does not need to exist is not free:
it is a protocol, a failure path, a build test, and a thing to explain. The bar
is a stall somebody can see, or bytes that need not be downloaded yet.
