/**
 * Tokenising source, away from the thread that has to draw it.
 *
 * The one piece of work on this desktop where a worker buys a frame somebody
 * can see. A file may be up to 200KB — see `MAX_TEXT_BYTES` in `utils/github` —
 * and lowlight walks all of it synchronously, while the window it is destined
 * for is still animating open. On the main thread that is a stall in the middle
 * of a transition, which is the most visible place a stall can happen.
 *
 * Only the tokenising travels. The tree that comes back is turned into nodes on
 * the main thread, because that half needs `document` and cannot move — see
 * `build` in `utils/highlight`. It is not obviously the cheaper half either:
 * one element per token is a lot of DOM. Moving what can move is still worth
 * it, and it is worth being honest that it is not the whole cost.
 *
 * Nothing in this file may touch the DOM, and nothing may import anything that
 * does. That is the whole contract of a job module.
 */
import { createLowlight } from "lowlight";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import makefile from "highlight.js/lib/languages/makefile";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

const lowlight = createLowlight({
  bash,
  css,
  dockerfile,
  go,
  ini,
  javascript,
  json,
  makefile,
  markdown,
  python,
  rust,
  sql,
  typescript,
  xml,
  yaml
});

/**
 * The token tree, or nothing at all.
 *
 * `undefined` means "show it as plain text" — an unregistered language, or a
 * grammar that threw. Unhighlighted source is a small loss; a file that will
 * not open is not, so every failure here is answered rather than raised.
 *
 * What comes back is a hast tree, which is plain objects and strings and
 * therefore survives being copied across the boundary unchanged. That it clones
 * for free is the reason this split is worth making at all.
 */
export function tokens(language: string, code: string): unknown {
  if (!lowlight.registered(language)) return undefined;
  try {
    return lowlight.highlight(language, code);
  } catch {
    return undefined;
  }
}
