import EventEmitter from "eventemitter3";
import type { IconName } from "../components/Icon";

/**
 * How anything on this desktop says something to the person using it.
 *
 * One call, from anywhere, knowing nothing: not where the desktop is mounted,
 * not what a toast looks like, not whether anybody is listening. A window deep
 * in the tree can say a thing happened without being handed a host element to
 * say it into, which is the whole reason this is a bus and not a function on
 * the desktop.
 *
 *     notify({
 *       sender: "Projects",
 *       glyph: "projects",
 *       title: "GitHub is not answering",
 *       text: "Showing what was cached an hour ago.",
 *     })
 *
 * What arrives is a *tip* in Apple's sense rather than a notification in the
 * everyday one: passive, dismissible, and gone on its own. Nothing here has a
 * level, a sound or a badge, and adding one would be the moment to argue about
 * whether this desktop has anything urgent enough to deserve it. It does not.
 */

export interface Notification {
  /** Which part of the desktop is talking. Two words at most. */
  sender: string;
  /** The mark that part wears elsewhere, so the tip teaches where to look. */
  glyph: IconName;
  /** One line, sentence case, skimmable alone. */
  title: string;
  /** The detail under it. One sentence. */
  text: string;
  /** Optional, and named for what it does rather than "OK". */
  action?: { label: string; run: () => void };
  /** Called when it goes, with whether the action was taken. */
  onGone?: (taken: boolean) => void;
  /**
   * Handed a way to take this message back, once it is on screen.
   *
   * Because a thing that was worth saying can stop being worth saying: the
   * repositories start answering again, the process that offered a tip is
   * killed while the tip is still up. Withdrawing is the poster's business —
   * nothing else knows when a message has gone stale — and it is optional,
   * because most messages are true until they fade.
   */
  onShown?: (dismiss: () => void) => void;
}

const bus = new EventEmitter();

/**
 * Things said before anything was listening.
 *
 * The desktop mounts the surface partway through its own startup, and a window
 * that has something to say during boot should not lose it because it spoke
 * first. Small on purpose: this is a short gap, not a mailbox, and a backlog of
 * fifty tips arriving at once would be worse than the five that were dropped.
 */
const waiting: Notification[] = [];
const MOST_HELD = 5;

/** Say something. Safe from anywhere, at any time, including before boot. */
export function notify(notification: Notification): void {
  if (bus.listenerCount("notify") === 0) {
    waiting.push(notification);
    if (waiting.length > MOST_HELD) waiting.shift();
    return;
  }
  bus.emit("notify", notification);
}

/**
 * Draw them. One listener, in practice — the toast stack.
 *
 * Anything held while nobody was listening is delivered on subscribing, in the
 * order it was said. Returns a handle rather than the emitter, because
 * eventemitter3's `on` hands back the emitter and that has no way off.
 */
export function onNotify(
  listener: (notification: Notification) => void
): { unsubscribe: () => void } {
  bus.on("notify", listener);
  waiting.splice(0).forEach((held) => bus.emit("notify", held));
  return {
    unsubscribe: () => {
      bus.off("notify", listener);
    }
  };
}

/** Drop the backlog and every listener. For tests. */
export function resetNotifications(): void {
  waiting.length = 0;
  bus.removeAllListeners();
}
