import { CHAT_MODEL, CHAT_MODELS, type DevicePreference } from "@thatcatdev/browser-ai";

/**
 * Which model a machine can hold, and what to do when one could not.
 *
 * A model that does not fit does not fail. On a phone the browser kills the
 * tab once it uses more memory than the OS will give it, and that takes the
 * whole page down: no exception, nothing for `warm()` to catch, just a reload.
 * Mobile Safari says "A problem repeatedly occurred" and Chrome shows its
 * "Aw, Snap!" page. Qwen 0.5B does this on phones. It is 800MB on the wire,
 * and its 150,000-token embedding table alone unpacks to over half a gigabyte
 * of full-precision floats, before the runtime has made a working copy.
 *
 * So there are two answers here, because neither is enough by itself:
 *
 * - Guess beforehand. A phone starts on the smallest model rather than the
 *   default. The guess is about the device rather than the screen, since a
 *   narrow desktop window has plenty of memory.
 * - Notice afterwards. The model being loaded is written down before the load
 *   starts and crossed out when it ends. If the page comes back with it still
 *   written down, the load killed the tab. Opening the window again must then
 *   not do the same thing, or the desktop becomes something that crashes
 *   whenever the chat is opened.
 */

/** The smallest model, which a phone can hold. */
export const SMALLEST = CHAT_MODELS[0].id;

/**
 * Whether this is a device that a model larger than the smallest is likely to
 * take down.
 *
 * `deviceMemory` is the honest signal, and only Chromium reports it. Safari
 * never does, and iOS is where tabs are killed soonest. Where the browser will
 * not say, a coarse primary pointer stands in for "phone or tablet". It is
 * coarse in both senses, and it errs the safe way: a tablet that could have
 * held the larger model starts on the small one, and it can still choose the
 * larger one.
 */
export function constrained(): boolean {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number") return memory <= 4;
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

/** The model to start on when nobody has chosen one. */
export function startingModel(): string {
  return constrained() ? SMALLEST : CHAT_MODEL;
}

/** One step down from a model that did not fit, or nothing if there is none. */
export function smallerThan(model: string): string | undefined {
  const at = CHAT_MODELS.findIndex((m) => m.id === model);
  return at > 0 ? CHAT_MODELS[at - 1].id : undefined;
}

const KEY = "chat-loading";

interface Attempt {
  model: string;
  device: DevicePreference;
}

/*
 * localStorage, not the Dexie settings table, because it is synchronous. The
 * note has to exist before the first byte is asked for, and `warm()` should
 * not have to wait on IndexedDB to start a download. Every access is guarded:
 * private modes and blocked storage throw, and the cost of that is only that
 * a crash goes unnoticed, which is how this behaved before.
 */

/** Written just before a model starts loading. */
export function attempting(attempt: Attempt): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(attempt));
  } catch {
    // Unrecorded; see above.
  }
}

/** Crossed out when the load ends, however it ended, or the page leaves normally. */
export function attempted(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to cross out.
  }
}

/**
 * The same, without clearing it, for asking without being the chat window.
 * See `chatRuns` in `./support`.
 */
export function peekCrash(): Attempt | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Attempt>) : undefined;
    return typeof parsed?.model === "string"
      ? { model: parsed.model, device: parsed.device ?? "auto" }
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The load that was running when this page last died, if one was.
 *
 * Reading the note also clears it. The next open after a crash steps down, and
 * the open after that tries whatever is chosen. One crash is reason to be
 * careful, but it should not permanently stop somebody trying again.
 */
export function crashedLoading(): Attempt | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as Partial<Attempt>;
    return typeof parsed.model === "string"
      ? { model: parsed.model, device: parsed.device ?? "auto" }
      : undefined;
  } catch {
    return undefined;
  }
}

/*
 * A reload, a closed tab or a navigation away all fire `pagehide`. A tab killed
 * for its memory fires nothing. Clearing the note here is what stops somebody
 * reloading during a download from being told the model crashed the page.
 */
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", attempted);
}
