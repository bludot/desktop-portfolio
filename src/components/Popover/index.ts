import OSElement from "../../utils/OSElement";
import { color, font, radius, size, weight } from "../../theme";
import { prefersReducedMotion } from "../../utils/motion";

/**
 * A small floating panel that points at something.
 *
 * It knows two things and nothing else: how to sit near a rectangle without
 * falling off the screen, and how not to steal what is underneath it. What goes
 * inside is the caller's business — a row of actions, or any node at all — so
 * the same component serves a selection toolbar, a context menu, or whatever
 * comes next.
 *
 * Everything is measured in viewport coordinates, so it does not care which
 * window, scroll container or transform its anchor happens to live in.
 */

export interface PopoverAction {
  label: string;
  onPress: () => void | Promise<void>;
  /** Draws a hairline before this action. */
  separated?: boolean;
}

/** Anything with edges — a DOMRect, or a line of a text selection. */
export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PlaceOptions {
  /** Which side to try first. Flips when there is no room. */
  prefer?: "above" | "below";
  /** Distance from the anchor. */
  gap?: number;
}

/** Kept from the edges of the screen. */
const MARGIN = 6;
const DEFAULT_GAP = 8;

/**
 * Where the panel goes, given its size, its anchor and the viewport.
 *
 * Pure, so the awkward cases — an anchor at the very top, one at the far right,
 * a panel wider than the screen — can be checked without laying anything out.
 */
export function place(
  anchor: AnchorRect,
  panel: { width: number; height: number },
  viewport: { width: number; height: number },
  options: PlaceOptions = {}
): { left: number; top: number; side: "above" | "below" } {
  const gap = options.gap ?? DEFAULT_GAP;
  const prefer = options.prefer ?? "above";

  const centre = (anchor.left + anchor.right) / 2;
  const furthestLeft = Math.max(MARGIN, viewport.width - panel.width - MARGIN);
  const left = Math.min(Math.max(MARGIN, centre - panel.width / 2), furthestLeft);

  const above = anchor.top - panel.height - gap;
  const below = anchor.bottom + gap;
  const fitsAbove = above >= MARGIN;
  const fitsBelow = below + panel.height <= viewport.height - MARGIN;

  // Preference first, the other side if it does not fit, and above as the
  // last resort — a panel over the text beats one off the bottom of the screen.
  let side: "above" | "below";
  if (prefer === "above") side = fitsAbove || !fitsBelow ? "above" : "below";
  else side = fitsBelow || !fitsAbove ? "below" : "above";

  return { left, top: side === "above" ? above : below, side };
}

class Popover extends OSElement {
  private actionButtons: HTMLElement[] = [];
  private open = false;
  private restoring?: ReturnType<typeof setTimeout>;

  constructor(id = "popover") {
    super("popover", id);

    /*
     * A press inside must not disturb what is outside. Selecting text and then
     * pressing Copy would otherwise collapse the selection before the button
     * could read it, because a mousedown outside a selection clears it.
     */
    this.element.addEventListener("mousedown", (e) => e.preventDefault());

    this.style = () => ({
      [this.id]: {
        position: "fixed",
        display: "none",
        alignItems: "center",
        gap: "2px",
        padding: "4px",
        borderRadius: radius.pill,
        background: color.chromeRaised,
        boxShadow: `0 12px 28px -12px rgba(0, 0, 0, .45), inset 0 0 0 1px ${color.line}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontFamily: font.ui,
        // Above the windows, below the overview.
        zIndex: "8100",
        opacity: 0,
        transform: "translateY(4px)",
        transition: "opacity 120ms ease, transform 120ms ease",
        "&.is-open": {
          display: "flex",
          opacity: 1,
          transform: "translateY(0)"
        },
        "& button": {
          border: "0",
          background: "none",
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          color: color.inkSoft,
          padding: "5px 10px",
          borderRadius: radius.control,
          cursor: "pointer",
          whiteSpace: "nowrap"
        },
        "& button:hover": { background: color.hover, color: color.ink },
        "& button:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        "& .popover-divider": {
          width: "1px",
          height: "16px",
          background: color.line,
          margin: "0 3px",
          flex: "0 0 auto"
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none"
        }
      }
    });
  }

  /** A row of buttons. The common case, so it has a shorthand. */
  setActions(actions: PopoverAction[]) {
    this.element.textContent = "";
    this.actionButtons = [];

    actions.forEach((action) => {
      if (action.separated && this.actionButtons.length) {
        const divider = document.createElement("span");
        divider.className = "popover-divider";
        divider.setAttribute("aria-hidden", "true");
        this.element.appendChild(divider);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.appendChild(document.createTextNode(action.label));
      button.addEventListener("click", () => void action.onPress());

      this.element.appendChild(button);
      this.actionButtons.push(button);
    });
  }

  /** Anything else. The panel only handles where it sits. */
  setContent(node: Node) {
    this.element.textContent = "";
    this.actionButtons = [];
    this.element.appendChild(node);
  }

  isOpen() {
    return this.open;
  }

  showAt(anchor: AnchorRect, options: PlaceOptions = {}) {
    // Shown before measuring: a display:none panel has no width to place by.
    this.element.classList.add("is-open");
    this.open = true;

    const { left, top, side } = place(
      anchor,
      { width: this.element.offsetWidth, height: this.element.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      options
    );

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    this.element.dataset.side = side;
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.element.classList.remove("is-open");
    this.restore();
  }

  /**
   * Say something happened, in place, without the panel changing size — a
   * toolbar that jumps as it answers is worse than one that says nothing.
   */
  flash(message: string) {
    if (!this.actionButtons.length) return;
    this.restore();

    this.actionButtons.forEach((button, i) => {
      if (i === 0) {
        button.dataset.label = button.textContent ?? "";
        button.textContent = message;
      } else {
        button.style.visibility = "hidden";
      }
    });

    this.restoring = setTimeout(
      () => this.restore(),
      prefersReducedMotion() ? 600 : 900
    );
  }

  private restore() {
    if (this.restoring) {
      clearTimeout(this.restoring);
      this.restoring = undefined;
    }
    this.actionButtons.forEach((button) => {
      if (button.dataset.label !== undefined) {
        button.textContent = button.dataset.label;
        delete button.dataset.label;
      }
      button.style.visibility = "";
    });
  }
}

export default Popover;
