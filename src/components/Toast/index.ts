import OSElement from "../../utils/OSElement";
import { color, font, motion as motionToken, radius, shadow, size, weight } from "../../theme";
import { motion, prefersReducedMotion } from "../../utils/motion";

/**
 * A small panel that says one thing and goes away.
 *
 * The desktop's only uninvited surface, which is the whole reason it is built
 * the way it is: it never covers a window, it never takes focus, it cannot
 * steal a keystroke, and it leaves on its own. Anything that fails those is not
 * a toast, it is an interruption with rounded corners.
 *
 * Above the taskbar rather than over the desktop, because that is the edge this
 * desktop already uses for things the system is saying — and far enough from
 * the start button that reaching for the menu never lands on a suggestion that
 * appeared a moment ago.
 */

/** Long enough to read twice, short enough to ignore once. */
const LINGER_MS = 9_000;

/** Under the drag shim, over every window. It is a message, not a modal. */
const TOAST_Z = 9400;

export interface ToastContent {
  text: string;
  action?: { label: string; run: () => void };
  /** Called when it leaves, however it leaves. */
  onGone?: (taken: boolean) => void;
}

class Toast extends OSElement {
  private timer?: ReturnType<typeof setTimeout>;
  private taken = false;
  private onGone?: (taken: boolean) => void;

  constructor(private readonly content: ToastContent) {
    super("toast", "toast");
    this.className = "toast";
    this.onGone = content.onGone;

    this.style = () => ({
      [this.id]: {
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(var(--taskbar-floor, 65px) + 12px)",
        zIndex: `${TOAST_Z}`,
        maxWidth: "min(460px, calc(100vw - 30px))",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px 14px",
        borderRadius: radius.window,
        background: color.chromeSolid,
        boxShadow: `${shadow.chrome}, ${shadow.edge}`,
        color: color.ink,
        fontFamily: font.ui,
        fontSize: size.bodyTight,
        lineHeight: 1.4,

        "& .toast-text": { flex: "1 1 auto", minWidth: 0 },

        "& .toast-do": {
          flex: "0 0 auto",
          border: `1px solid ${color.lineSoft}`,
          background: "transparent",
          borderRadius: radius.control,
          color: color.ink,
          font: "inherit",
          fontWeight: weight.emphasise,
          padding: "5px 11px",
          cursor: "pointer",
          transition: "background 150ms ease"
        },
        "& .toast-do:hover": { background: color.hover },

        "& .toast-close": {
          flex: "0 0 auto",
          border: "0",
          background: "transparent",
          color: color.inkFaint,
          font: "inherit",
          fontSize: size.small,
          lineHeight: 1,
          padding: "4px 2px",
          cursor: "pointer"
        },
        "& .toast-close:hover": { color: color.ink }
      }
    });
  }

  async beforeLoad() {
    const line = document.createElement("span");
    line.className = "toast-text";
    line.appendChild(document.createTextNode(this.content.text));
    this.element.appendChild(line);

    if (this.content.action) {
      const act = document.createElement("button");
      act.type = "button";
      act.className = "toast-do";
      act.appendChild(document.createTextNode(this.content.action.label));
      act.addEventListener("click", () => {
        this.taken = true;
        this.content.action?.run();
        void this.leave();
      });
      this.element.appendChild(act);
    }

    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    // A name, not a glyph: the mark is a multiplication sign and a screen
    // reader says so.
    close.setAttribute("aria-label", "Dismiss");
    close.appendChild(document.createTextNode("✕"));
    close.addEventListener("click", () => void this.leave());
    this.element.appendChild(close);

    /*
     * Announced, not focused.
     *
     * `polite` waits for a gap rather than cutting in, which is the same
     * courtesy the visual version extends. Moving focus here would take the
     * cursor out of whatever somebody was typing, which is exactly the kind of
     * interruption this is built not to be.
     */
    this.element.setAttribute("role", "status");
    this.element.setAttribute("aria-live", "polite");
  }

  async afterLoad() {
    await motion.enter(this.element, motion.popIn);
    // Only once it is actually up: a toast that starts its own clock while
    // still animating in is readable for less time than it promises.
    this.timer = setTimeout(() => void this.leave(), LINGER_MS);
  }

  /** Take it away, whatever brought that about. */
  async leave(): Promise<void> {
    if (!this.mounted) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;

    if (!prefersReducedMotion()) {
      try {
        await motion.popOut(this.element);
      } catch {
        // A failed exit is not a reason to leave it on screen.
      }
    }
    /*
     * The exit fills forwards, so it goes on applying `opacity: 0` after it
     * ends — and an animation outranks every inline style, so this has to be
     * cancelled rather than overwritten. It has to happen here, too, while the
     * element is still in the document: `getAnimations()` on a detached element
     * reports none, and there is nothing left to cancel afterwards.
     */
    motion.clearAnimations(this.element);
    await this.unload();
    this.onGone?.(this.taken);
    this.onGone = undefined;
  }
}

export default Toast;
