import OSElement from "../../utils/OSElement";
import { onNotify, type Notification } from "../../notifications";
import Toast from "./index";

/**
 * The corner the desktop speaks from, and the queue behind it.
 *
 * Cards do not place themselves. They are children of one fixed column, which
 * means the browser does the arithmetic: when the middle one leaves, the ones
 * under it move up on their own, and nothing has to measure a height or track
 * an offset. Every hand-rolled version of this ends up recomputing positions on
 * a timer and drifting by a pixel; a flex column simply cannot.
 *
 * Newest at the top, which is where the eye already is after the last one
 * appeared there — and where every desktop that does this puts it.
 *
 * The column ignores the pointer and its children do not, so the empty space
 * between and beneath the cards is still the desktop: clicks pass through to
 * whatever is under it, and only the cards themselves catch anything.
 */

/** Above every window, under the drag shim. Messages are not modals. */
const STACK_Z = 9400;

/**
 * How many may be on screen at once.
 *
 * Three is the point where a corner stops being a corner and becomes a panel.
 * A fourth pushes the oldest out rather than growing the column, because
 * something that grows without limit is a log, and a log belongs in a window.
 */
const MOST_AT_ONCE = 3;

class ToastStack extends OSElement {
  constructor() {
    super("div", "toast-stack");
    this.className = "toast-stack";
    this.style = () => ({
      [this.id]: {
        position: "fixed",
        top: "18px",
        right: "18px",
        zIndex: `${STACK_Z}`,
        display: "flex",
        /*
         * Reversed, so the newest is at the top without anything being moved.
         *
         * Cards are appended in the order they were said and the column turns
         * that upside down. Reordering the nodes instead — inserting each new
         * one before the first — worked in a test and not in a browser, because
         * mounting is asynchronous and the move raced it. Nothing races a
         * stylesheet.
         */
        flexDirection: "column-reverse",
        gap: "10px",
        // The column is a place, not a surface: only the cards take the pointer.
        pointerEvents: "none",
        "& > *": { pointerEvents: "auto" },

        "@media (max-width: 640px)": {
          left: "12px",
          right: "12px",
          top: "12px"
        }
      }
    });
  }
}

let stack: ToastStack | undefined;
/** Oldest first, so the one to drop when the column is full is `shift()`. */
let showing: Toast[] = [];

/**
 * Say something in the corner.
 *
 * The column is built on the first call and kept afterwards — a visitor who is
 * never told anything never has one. Returns the card, for anything that wants
 * to take its own message away early.
 */
export function post(host: HTMLElement, content: Notification): Toast {
  if (!stack) {
    stack = new ToastStack();
    void stack.load(host);
  }

  /*
   * Make room before adding, not after.
   *
   * Dropping the oldest afterwards would put four in the column for a frame,
   * which on a short screen is a fourth card appearing and vanishing — the one
   * thing more distracting than the notification itself.
   */
  while (showing.length >= MOST_AT_ONCE) {
    void showing.shift()?.leave();
  }

  const toast = new Toast({
    ...content,
    onGone: (taken) => {
      showing = showing.filter((other) => other !== toast);
      content.onGone?.(taken);
    }
  });
  showing.push(toast);
  content.onShown?.(() => void toast.leave());

  // Appended in the order it was said; the column reverses it — see above.
  void toast.load(stack.getElement());

  return toast;
}

/**
 * Draw whatever anything on the desktop says, from now on.
 *
 * Called once, by the desktop, with the element the column belongs in.
 * Everything else on this desktop talks to `notify()` and never learns that
 * this exists — which is the point: a window with something to say should not
 * need to be handed a place to say it.
 */
export function showNotifications(host: HTMLElement): { unsubscribe: () => void } {
  return onNotify((notification) => post(host, notification));
}

/** Everything currently up, oldest first. */
export function posted(): readonly Toast[] {
  return [...showing];
}

/** Take them all away — when the process that posts them is killed, and in tests. */
export function clearToasts(): void {
  const going = [...showing];
  showing = [];
  going.forEach((toast) => void toast.leave());
  void stack?.unload();
  stack = undefined;
}
