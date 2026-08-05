import OSElement from "../../utils/OSElement";
import { radius } from "../../theme";
import Popover from "../Popover";

/**
 * Text selection, drawn rather than painted by the browser.
 *
 * `::selection` has no box model — it takes a colour and nothing else, so a
 * rounded selection is not something CSS can be asked for. The real selection
 * is left completely alone (copy, keyboard extension and screen readers all
 * behave exactly as before); only the paint is replaced, by reading the
 * selection's own rectangles and drawing them again with a radius.
 *
 * One layer for the whole desktop, not one per window: there is only ever one
 * selection, and `getClientRects()` already reports in viewport coordinates,
 * which side-steps every window's clipping, transform and stacking context.
 */

/** How much bigger than the text each shape is drawn. */
const PAD_X = 2;
const PAD_Y = 1;
/** Two rectangles within this many pixels vertically are the same line. */
const SAME_LINE_PX = 3;

export interface Line {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * One rectangle per line.
 *
 * `getClientRects()` gives a rectangle per line fragment, and more than one for
 * a line that crosses an inline element — a bold run mid-sentence produces
 * three. Left as they come, each fragment would be drawn as its own bubble and
 * a single line would look like a row of beads.
 */
export function mergeLines(rects: Line[]): Line[] {
  const lines: Line[] = [];

  [...rects]
    .filter((rect) => rect.right - rect.left > 0.5 && rect.bottom - rect.top > 0)
    .forEach((rect) => {
      const line = lines.find(
        (l) =>
          Math.abs(l.top - rect.top) < SAME_LINE_PX &&
          Math.abs(l.bottom - rect.bottom) < SAME_LINE_PX
      );
      if (line) {
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
      } else {
        lines.push({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right
        });
      }
    });

  return lines;
}

/**
 * The window a selection lives in, as a rectangle to stay inside.
 *
 * Text scrolled out of a window keeps its laid-out position, so its rectangles
 * carry on up past the window's top edge — one screenful of scrolling puts them
 * two thousand pixels above it. Painted on a viewport-level layer they would be
 * drawn there, over whatever else is on the desktop.
 */
export function clipBoundsOf(node: Node | null): Line | null {
  let element = node instanceof Element ? node : (node?.parentElement ?? null);

  while (element) {
    if (element.tagName === "WINDOW") {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      };
    }
    element = element.parentElement;
  }
  // Not inside a window — the taskbar, the launcher — so nothing to clip to.
  return null;
}

/** Trim each line to the bounds, dropping the ones left with no area. */
export function clipLines(lines: Line[], bounds: Line | null): Line[] {
  if (!bounds) return lines;

  return lines
    .map((line) => ({
      top: Math.max(line.top, bounds.top),
      bottom: Math.min(line.bottom, bounds.bottom),
      left: Math.max(line.left, bounds.left),
      right: Math.min(line.right, bounds.right)
    }))
    .filter((line) => line.bottom - line.top > 0.5 && line.right - line.left > 0.5);
}

/** The window a selection sits in, for attributing a quote. */
export function windowTitleOf(node: Node | null): string {
  let element = node instanceof Element ? node : (node?.parentElement ?? null);

  while (element) {
    if (element.tagName === "WINDOW") {
      return element.querySelector(".title-name")?.textContent?.trim() ?? "";
    }
    element = element.parentElement;
  }
  return "";
}

/** Quoted, and credited to the window it came from. */
export function asQuote(text: string, title: string): string {
  const quoted = `“${text.trim()}”`;
  return title ? `${quoted} — ${title}` : quoted;
}

/**
 * Phones and tablets already put their own toolbar over a selection, and two
 * of them fighting for the same space is worse than neither.
 */
const isTouch = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(hover: none)").matches;

class SelectionLayer extends OSElement {
  private popover: Popover;
  private tracking = 0;
  /** The last painted rectangles, so an unchanged frame writes nothing. */
  private shape = "";
  private text = "";
  private title = "";

  constructor() {
    super("selectionlayer", "selection-layer");
    this.popover = new Popover("selection-popover");

    this.style = () => ({
      [this.id]: {
        position: "fixed",
        inset: "0",
        // Above the windows, below the overview.
        zIndex: "8000",
        pointerEvents: "none",
        "& .selection-bubble": {
          position: "fixed",
          background: "var(--selection)",
          borderRadius: radius.chip,
          pointerEvents: "none"
        }
      }
    });
  }

  async load(element: HTMLElement) {
    await super.load(element);
    await this.popover.load(element);
    this.popover.setActions([
      { label: "Copy", onPress: () => this.copy(false) },
      { label: "Quote", onPress: () => this.copy(true), separated: true }
    ]);

    /*
     * Only now is the native paint turned off. Were it disabled in the
     * stylesheet outright, a failure to mount this layer would leave selection
     * invisible rather than merely square.
     */
    document.documentElement.classList.add("has-selection-layer");

    document.addEventListener("selectionchange", this.onSelectionChange);
  }

  async unload() {
    document.documentElement.classList.remove("has-selection-layer");
    document.removeEventListener("selectionchange", this.onSelectionChange);
    this.stopFollowing();
    await this.popover.unload();
    await super.unload();
  }

  /*
   * While anything is selected, follow it every frame.
   *
   * The obvious build listens for scroll and resize, and it is not enough: the
   * text moves for reasons that fire no event at all — a window dragged or
   * resized, a pane animating, a scroll event dropped because the tab is
   * throttled — and every one of those leaves the shapes behind at coordinates
   * the text has left. A frame loop has no such gaps, and it only runs while a
   * selection exists, which is rare and brief.
   *
   * Each frame is a measurement, not a repaint: the DOM is touched only when
   * the rectangles have actually moved.
   */
  private onSelectionChange = () => {
    this.paint();
    this.startFollowing();
  };

  private startFollowing() {
    if (this.tracking || typeof requestAnimationFrame !== "function") return;
    const step = () => {
      this.tracking = this.paint() ? requestAnimationFrame(step) : 0;
    };
    this.tracking = requestAnimationFrame(step);
  }

  private stopFollowing() {
    if (!this.tracking) return;
    cancelAnimationFrame(this.tracking);
    this.tracking = 0;
  }

  /** The selection, if there is one worth drawing. */
  private current(): { lines: Line[]; text: string; node: Node | null } {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      return { lines: [], text: "", node: null };
    }

    const text = selection.toString();
    if (!text.trim()) return { lines: [], text: "", node: null };

    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer;
    return {
      lines: clipLines(
        mergeLines([...range.getClientRects()]),
        clipBoundsOf(node)
      ),
      text,
      node
    };
  }

  /** Redraw if anything moved. True while there is still a selection. */
  paint = (): boolean => {
    const { lines, text, node } = this.current();
    this.text = text;

    if (!lines.length) {
      this.shape = "";
      this.element.textContent = "";
      this.popover.hide();
      return false;
    }

    // Sixty times a second, so the cheap check comes first: nothing is written
    // unless the rectangles have actually changed.
    const shape = lines
      .map((l) => `${l.top}|${l.left}|${l.right}|${l.bottom}`)
      .join(";");
    if (shape === this.shape) return true;
    this.shape = shape;

    this.element.textContent = "";
    lines.forEach((line) => {
      const bubble = document.createElement("div");
      bubble.className = "selection-bubble";
      bubble.style.left = `${line.left - PAD_X}px`;
      bubble.style.top = `${line.top - PAD_Y}px`;
      bubble.style.width = `${line.right - line.left + PAD_X * 2}px`;
      bubble.style.height = `${line.bottom - line.top + PAD_Y * 2}px`;
      this.element.appendChild(bubble);
    });

    if (isTouch()) {
      this.popover.hide();
      return true;
    }

    this.title = windowTitleOf(node);
    // Anchored to the whole selection, so it flips below the last line rather
    // than landing on top of the text when the first line is against the top.
    this.popover.showAt({
      top: lines[0].top,
      bottom: lines[lines.length - 1].bottom,
      left: lines[0].left,
      right: lines[0].right
    });

    return true;
  };

  private async copy(quote: boolean) {
    const text = this.text;
    if (!text) return;

    const payload = quote ? asQuote(text, this.title) : text;

    try {
      await navigator.clipboard.writeText(payload);
      this.popover.flash("Copied");
    } catch {
      // Denied, or no clipboard at all. Saying so beats a button that looks
      // as though it worked.
      this.popover.flash("Press ⌘C");
    }
  }
}

export default SelectionLayer;
