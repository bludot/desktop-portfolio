import { CHAT_MODELS, type ChatModel } from "@thatcatdev/browser-ai";
import { SMALLEST, peekCrash } from "./fit";

/**
 * Whether this browser can run a model, asked before a byte is fetched.
 *
 * Two kinds of answer, and the popup treats them differently:
 *
 * - **Blocked**: the browser lacks something the runtime cannot do without.
 *   No amount of waiting gets around it, so there is nothing to try.
 * - **Unlikely**: everything needed is there, but the model will very
 *   probably not fit. Phones do not fail politely. The tab is killed and the
 *   page reloads, so somebody should be told before they spend a few hundred
 *   megabytes finding that out, and then left to try anyway if they like.
 *
 * Only what the browser will actually say is used. Safari reports neither its
 * memory nor the device model, so on an iPhone the answer is about the
 * platform's limit and not the particular phone. That is less precise than a
 * person would like, and it is still more than guessing.
 *
 * Synchronous on purpose: every check is a property read or a validation of a
 * few bytes, and the window should not wait on a promise to start loading.
 */

export interface Verdict {
  /** True when there is nothing to try: see above. */
  blocked: boolean;
  title: string;
  /** Each reason as a sentence somebody who is not an engineer could act on. */
  reasons: string[];
  /** A smaller model that would fit, when the trouble is size. */
  smaller?: ChatModel;
}

/**
 * The smallest module that uses a SIMD instruction.
 *
 * onnxruntime-web now ships only SIMD builds, so a browser that refuses this
 * cannot run any model at all. Safari gained SIMD in 16.4, which makes this
 * the test for "this iPhone's iOS is too old" as well, without reading a
 * version number out of the user agent.
 */
const SIMD = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0,
  65, 0, 253, 15, 253, 98, 11
]);

/**
 * Roughly how much memory a model takes once loaded, from its download.
 *
 * About three times the file: the weights are unpacked into the runtime's
 * heap, the embedding table stays at full precision, and for a moment while
 * the session is built the file and the unpacked copy are both held. Measured
 * loosely rather than exactly, which suits a number used for a warning.
 */
const WORKING_SET = 3;

/**
 * About what Safari on an iPhone lets a page use before closing it.
 *
 * It depends on the phone and on what else is open, so this is a cautious
 * figure. It was chosen so the smallest model passes, since that is the one
 * that has been seen to work, and the next one up fails, since that one has
 * been seen to crash the tab.
 */
const IOS_PAGE_LIMIT = 1_000_000_000;

function ios(): boolean {
  const ua = navigator.userAgent;
  // iPadOS asks for the desktop site and claims to be a Mac. A Mac with a
  // touchscreen does not exist, so the touch points give it away.
  return (
    /iP(hone|ad|od)/.test(ua) ||
    (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1)
  );
}

const needs = (model: ChatModel) => model.bytes * WORKING_SET;

const gb = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)}GB` : `${Math.round(bytes / 1e6)}MB`;

/** Why a model of this size will not fit here, or nothing if it might. */
function tooBig(model: ChatModel): string | undefined {
  if (ios() && needs(model) > IOS_PAGE_LIMIT) {
    return `Safari on iPhone and iPad closes a page that uses more than about ${gb(IOS_PAGE_LIMIT)} of memory, and ${model.label} needs about ${gb(needs(model))} once it is loaded.`;
  }

  /*
   * Chromium reports memory, rounded to a power of two and capped at 8. A
   * tab gets about half of it. 8 means "8 or more", so it never warns:
   * otherwise every desktop would be told the 1B model will not fit.
   */
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory < 8 && (memory * 1e9) / 2 < needs(model)) {
    return `This device has about ${memory}GB of memory, and ${model.label} needs about ${gb(needs(model))} once it is loaded.`;
  }
  return undefined;
}

/**
 * What stands between this browser and the model, or nothing if nothing does.
 *
 * `crashed` says that this exact model was loading when the page last died,
 * which is the one thing known about this particular device and not a guess.
 */
export function assess(modelId: string, crashed = false): Verdict | undefined {
  if (typeof WebAssembly !== "object") {
    return {
      blocked: true,
      title: "The chat can't run in this browser",
      reasons: [
        "WebAssembly is turned off here, and the model runs on it. On an iPhone or iPad this is usually Lockdown Mode, which you can turn off for this site in Safari's settings."
      ]
    };
  }

  let simd = false;
  try {
    simd = WebAssembly.validate(SIMD);
  } catch {
    // Treated as absent.
  }
  if (!simd) {
    return {
      blocked: true,
      title: "The chat can't run in this browser",
      reasons: [
        "This browser is too old for the model's runtime. On an iPhone or iPad, updating to iOS 16.4 or later fixes it. Elsewhere, a current Chrome, Edge, Firefox or Safari will work."
      ]
    };
  }

  const model = CHAT_MODELS.find((m) => m.id === modelId);
  if (!model) return undefined;

  const reasons: string[] = [];
  if (crashed) {
    reasons.push(
      `Last time ${model.label} was loaded here, the page ran out of memory and reloaded.`
    );
  }
  const size = tooBig(model);
  if (size) reasons.push(size);
  if (!reasons.length) return undefined;

  // The largest one smaller than this that is not too big as well.
  const smaller = CHAT_MODELS.slice(0, CHAT_MODELS.indexOf(model))
    .reverse()
    .find((m) => !tooBig(m));

  return {
    blocked: false,
    title: `${model.label} probably won't run on this device`,
    reasons,
    smaller
  };
}

/**
 * Whether the chat can run here at all, for anything that would point at it.
 *
 * The test is the smallest model, since a visitor can always step down to it,
 * so a device that cannot run that one cannot run any of them. A crash of the
 * smallest model counts too: it is the one fact known about this device rather
 * than inferred. Read without clearing it, because only the chat window acts
 * on it.
 */
export function chatRuns(): boolean {
  return !assess(SMALLEST, peekCrash()?.model === SMALLEST);
}
