import OSElement from "../../utils/OSElement";
import { color, font, radius, shadow, size, weight } from "../../theme";
import { icon } from "../Icon";
import { motion, prefersReducedMotion } from "../../utils/motion";
import type { Notification } from "../../notifications";

/**
 * A card in the corner that says one thing and goes away.
 *
 * Apple's guidance has a name for this and it is not "notification": a
 * notification reports an event, and this reports nothing — it points at a
 * feature somebody has not found. That is filed under *offering help*, and the
 * component is a **tip**. Everything below follows from taking that seriously.
 *
 * It is also the lowest interruption level there is — *passive*, information a
 * person may look at whenever they like. So: no sound, no badge, no count, no
 * accumulation, and nothing that survives being ignored. It leaves on its own
 * and takes the message with it.
 *
 * The shape is the one three decades of desktops have taught people to read: a
 * symbol on the left saying which part of the system is talking, a short title,
 * a line of detail, and a way out. The symbol is the feature's own — the
 * launcher's magnifier, the chat's bubble — because a tip that shows the mark
 * you will later look for is teaching you where to find it.
 *
 * What it must never do, in order: cover a window it did not ask to cover, take
 * focus, or outlive the visitor's patience.
 */

/** Long enough to read twice, short enough to ignore once. */
const LINGER_MS = 9_000;

/** What a card draws. Declared once, on the bus — see `notifications`. */
export type ToastContent = Notification;

class Toast extends OSElement {
  /**
   * The mount, so leaving can wait for it.
   *
   * A card can be asked to go before it has finished arriving — three posted in
   * the same tick push the first out while it is still loading. Without this,
   * `leave` found nothing mounted, returned, and the card then finished
   * mounting into a column that had already forgotten it: a notification with
   * no way of ever being taken away again.
   */
  private mounting?: Promise<void>;
  private timer?: ReturnType<typeof setTimeout>;
  private taken = false;
  private onGone?: (taken: boolean) => void;

  constructor(private readonly content: ToastContent) {
    super("toast", "toast");
    this.className = "toast";
    this.onGone = content.onGone;

    this.style = () => ({
      [this.id]: {
        // Placed by the column it lives in — see `Toast/stack`.
        width: "316px",
        maxWidth: "100%",
        boxSizing: "border-box",
        display: "flex",
        gap: "12px",
        padding: "13px",
        /*
         * A touch rounder than a window. It is not one, and the corner is the
         * cheapest way to say so before anybody reads a word of it.
         */
        borderRadius: "14px",
        background: color.glassWindow,
        backdropFilter: "blur(30px) saturate(1.2)",
        WebkitBackdropFilter: "blur(30px) saturate(1.2)",
        boxShadow: `${shadow.window}, ${shadow.edge}`,
        color: color.ink,
        fontFamily: font.ui,

        "& .toast-mark": {
          flex: "0 0 auto",
          width: "34px",
          height: "34px",
          borderRadius: "9px",
          background: color.chromeRaised,
          display: "grid",
          placeItems: "center",
          color: color.ink
        },
        "& .toast-mark svg": { width: "17px", height: "17px" },

        "& .toast-body": { flex: "1 1 auto", minWidth: 0 },

        // The sender, in the mono the rest of the desktop uses for labels.
        "& .toast-from": {
          fontFamily: font.mono,
          fontSize: "9.5px",
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: color.inkFaint,
          marginBottom: "3px"
        },
        "& .toast-title": {
          fontSize: size.bodyTight,
          fontWeight: weight.emphasise,
          lineHeight: 1.3
        },
        "& .toast-text": {
          fontSize: "12.5px",
          color: color.inkSoft,
          lineHeight: 1.42,
          marginTop: "3px"
        },

        "& .toast-do": {
          marginTop: "9px",
          border: `1px solid ${color.lineSoft}`,
          background: "transparent",
          borderRadius: radius.control,
          color: color.ink,
          font: "inherit",
          fontSize: "12.5px",
          fontWeight: weight.emphasise,
          padding: "5px 11px",
          cursor: "pointer",
          transition: "background 150ms ease"
        },
        "& .toast-do:hover": { background: color.hover },

        "& .toast-close": {
          flex: "0 0 auto",
          alignSelf: "flex-start",
          border: "0",
          background: "transparent",
          color: color.inkFaint,
          font: "inherit",
          fontSize: size.small,
          lineHeight: 1,
          padding: "4px",
          cursor: "pointer"
        },
        "& .toast-close:hover": { color: color.ink },

        // On a phone the column spans the width, and the card fills it.
        "@media (max-width: 640px)": { width: "auto" }
      }
    });
  }

  async beforeLoad() {
    const mark = document.createElement("span");
    mark.className = "toast-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.appendChild(icon(this.content.glyph));
    this.element.appendChild(mark);

    const body = document.createElement("div");
    body.className = "toast-body";

    const from = document.createElement("div");
    from.className = "toast-from";
    from.appendChild(document.createTextNode(this.content.sender));
    body.appendChild(from);

    const title = document.createElement("div");
    title.className = "toast-title";
    title.appendChild(document.createTextNode(this.content.title));
    body.appendChild(title);

    const text = document.createElement("div");
    text.className = "toast-text";
    text.appendChild(document.createTextNode(this.content.text));
    body.appendChild(text);

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
      body.appendChild(act);
    }
    this.element.appendChild(body);

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
     * courtesy the visual version extends — and the right level for something
     * passive. Moving focus here would take the cursor out of whatever somebody
     * was typing, which is exactly the interruption this is built not to be.
     */
    this.element.setAttribute("role", "status");
    this.element.setAttribute("aria-live", "polite");
  }

  async afterLoad() {
    await motion.enter(this.element, motion.popIn);
    // Only once it is up: a card that starts its own clock while still
    // animating in is readable for less time than it promises.
    this.timer = setTimeout(() => void this.leave(), LINGER_MS);
  }

  async load(element: HTMLElement): Promise<void> {
    this.mounting = super.load(element);
    return this.mounting;
  }

  /** Take it away, whatever brought that about. */
  async leave(): Promise<void> {
    // Arrive first, then go. See `mounting`.
    await this.mounting;
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
     * cancelled rather than overwritten. While the element is still in the
     * document, too: `getAnimations()` on a detached one reports none, and
     * there is nothing left to cancel afterwards.
     */
    motion.clearAnimations(this.element);
    await this.unload();
    this.onGone?.(this.taken);
    this.onGone = undefined;
  }
}

export default Toast;
