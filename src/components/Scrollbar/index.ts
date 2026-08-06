import jss, { StyleSheet } from "jss";
import debounce from "../../utils/debounce";
import OSElement from "../../utils/OSElement";
import { raiseDragShim, dropDragShim } from "../../utils/dragShim";
import { color } from "../../theme";

/** How close the pointer must get to the edge before the bar appears. */
const PROXIMITY_PX = 40;
/** Never shrink the thumb below this, or long documents give you nothing to grab. */
const MIN_THUMB_PX = 24;
const TRACK_WIDTH_PX = 10;
const HIDE_AFTER_MS = 1000;

/** Down the right-hand edge, or along the bottom. */
export type Axis = "y" | "x";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/*
 * One sheet per axis for the whole desktop, rather than one per bar.
 *
 * There is a bar on every scrolling box now — a window, the launcher's results,
 * and every code block in every README — and the base class would give each of
 * them its own generated class and its own <style> element, all holding the
 * same six rules. Nothing in here varies per instance: the colours are custom
 * properties, so one sheet survives a change of theme, and everything that
 * moves is written inline.
 */
const sheets = new Map<string, StyleSheet>();

function sheetFor(id: string, style: () => any): StyleSheet {
  let sheet = sheets.get(id);
  if (!sheet) {
    sheet = jss.createStyleSheet(style()).attach();
    sheets.set(id, sheet);
  }
  return sheet;
}

/**
 * An overlay scrollbar. The container keeps scrolling natively — this only
 * draws the bar and lets you drag it.
 *
 * Deliberately not a custom scroll implementation: taking the wheel over means
 * losing trackpad momentum, the OS scroll settings, keyboard paging and
 * find-in-page, and no hand-rolled easing matches what the platform already
 * does. The native scrollbar is hidden with CSS instead, and this listens to
 * the scroll event to stay in step.
 *
 * The track mounts outside the scrolling box, so it never has to be corrected
 * back into view as the content moves. It is positioned from the box's
 * `offsetTop`/`offsetLeft`, which means it must be mounted into the box's
 * offset parent — `overlayScroll` below works out where that is, and makes one
 * if there is nothing suitable.
 */
class ScrollBar extends OSElement {
  private readonly axis: Axis;
  private readonly thumb: HTMLElement;
  private readonly hideSoon: () => void;

  private scroller: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private dragging = false;
  private dragPointerStart = 0;
  private dragScrollStart = 0;

  // Bound once so removeEventListener can match what was registered.
  private readonly onScroll = this.handleScroll.bind(this);
  private readonly onPointerNear = this.pointerNear.bind(this) as EventListener;
  private readonly onPointerLeave = this.hideSoonIfIdle.bind(this) as EventListener;
  private readonly onThumbDown = this.thumbMouseDown.bind(this) as EventListener;
  private readonly onThumbMove = this.thumbMouseMove.bind(this);
  private readonly onThumbUp = this.thumbMouseUp.bind(this);

  constructor(axis: Axis = "y") {
    super("scrollbar", axis === "y" ? "scrollbar" : "scrollbar-x");
    this.axis = axis;

    this.thumb = document.createElement("div");
    this.thumb.className = "bar";
    this.element.appendChild(this.thumb);

    this.hideSoon = debounce(this.hide.bind(this), HIDE_AFTER_MS, false);

    // Structure only. Anything that moves is written inline, so scrolling never
    // rebuilds a stylesheet.
    this.style = () => ({
      [this.id]: {
        position: "absolute",
        // Fades rather than sliding off the edge: the window does not clip its
        // children, so anything parked outside would hang over the desktop.
        opacity: 0,
        zIndex: "2",
        transition: "opacity 200ms",
        userSelect: "none",
        // The bar floats over the content; clicks that miss the thumb should
        // reach whatever is underneath.
        pointerEvents: "none",
        "& > .bar": {
          position: "relative",
          // The thickness is fixed; the length is the part that is measured.
          ...(this.vertical
            ? { width: `${TRACK_WIDTH_PX}px` }
            : { height: `${TRACK_WIDTH_PX}px` }),
          borderRadius: `${TRACK_WIDTH_PX / 2}px`,
          backgroundColor: color.scrollbar,
          cursor: "pointer",
          // Starts unclickable to match the resting opacity of 0; show() turns
          // it on. Otherwise a thumb nobody can see still swallows clicks along
          // the right edge — including the window's resize handle.
          pointerEvents: "none",
          transition: "background-color 150ms",
          "&:hover": {
            backgroundColor: color.scrollbarHover
          }
        }
      }
    });
  }

  /** Point the bar at the element whose native scrolling it should mirror. */
  attachTo(scroller: HTMLElement): void {
    this.scroller = scroller;
  }

  /*
   * The sheet is shared, so attaching is only a matter of wearing its class,
   * and unloading must leave it alone — the next bar to mount is still using it.
   */
  applyStyle(): void {
    const sheet = sheetFor(this.id, this.style);
    this.element.className += " " + sheet.classes[this.id];
  }

  unloadStyle(): void {}

  // ---------------------------------------------------------------- geometry

  private get vertical(): boolean {
    return this.axis === "y";
  }

  /** How much of the content is on screen, along the axis this bar runs. */
  private get viewport(): number {
    const el = this.scroller;
    if (!el) return 0;
    return this.vertical ? el.clientHeight : el.clientWidth;
  }

  private get contentLength(): number {
    const el = this.scroller;
    if (!el) return 0;
    return this.vertical ? el.scrollHeight : el.scrollWidth;
  }

  private get scrollPosition(): number {
    const el = this.scroller;
    if (!el) return 0;
    return this.vertical ? el.scrollTop : el.scrollLeft;
  }

  private set scrollPosition(value: number) {
    const el = this.scroller;
    if (!el) return;
    if (this.vertical) el.scrollTop = value;
    else el.scrollLeft = value;
  }

  private get scrollRange(): number {
    if (!this.scroller) return 0;
    return Math.max(0, this.contentLength - this.viewport);
  }

  private get thumbLength(): number {
    const content = this.contentLength;
    if (!this.scroller || content <= 0) return MIN_THUMB_PX;
    const viewport = this.viewport;
    const proportional = (viewport / content) * viewport;
    return clamp(proportional, MIN_THUMB_PX, viewport);
  }

  /** Redraw track and thumb from the container's current scroll position. */
  sync(): void {
    const el = this.scroller;
    if (!el) return;

    const viewport = this.viewport;
    const thumbLength = this.thumbLength;
    const travel = Math.max(0, viewport - thumbLength);
    const progress = this.scrollRange > 0 ? this.scrollPosition / this.scrollRange : 0;
    const offset = clamp(progress, 0, 1) * travel;

    // Line the track up with the scrolling box: along the box for its whole
    // length, and laid over the far edge across it.
    if (this.vertical) {
      this.element.style.top = `${el.offsetTop}px`;
      this.element.style.left = `${el.offsetLeft + el.clientWidth - TRACK_WIDTH_PX}px`;
      this.element.style.height = `${viewport}px`;
      this.element.style.width = `${TRACK_WIDTH_PX}px`;
      this.thumb.style.height = `${thumbLength}px`;
      this.thumb.style.top = `${offset}px`;
    } else {
      this.element.style.left = `${el.offsetLeft}px`;
      this.element.style.top = `${el.offsetTop + el.clientHeight - TRACK_WIDTH_PX}px`;
      this.element.style.width = `${viewport}px`;
      this.element.style.height = `${TRACK_WIDTH_PX}px`;
      this.thumb.style.width = `${thumbLength}px`;
      this.thumb.style.left = `${offset}px`;
    }

    // Nothing to scroll means nothing to show.
    this.element.style.display = this.scrollRange > 0 ? "" : "none";
  }

  private handleScroll(): void {
    this.sync();
    this.show();
    this.hideSoonIfIdle();
  }

  // ------------------------------------------------------------- visibility

  show(): void {
    this.element.style.opacity = "1";
    this.thumb.style.pointerEvents = "auto";
  }

  hide(): void {
    // A drag in progress outranks the idle timer.
    if (this.dragging) return;
    this.element.style.opacity = "0";
    // Invisible means unclickable, or you can grab a bar you cannot see.
    this.thumb.style.pointerEvents = "none";
  }

  private hideSoonIfIdle(): void {
    if (this.dragging) return;
    this.hideSoon();
  }

  /**
   * Reveal the bar when the pointer comes near the edge it runs along.
   *
   * Near the right-hand edge for a vertical bar, because the box is usually a
   * whole window and reacting to the pointer anywhere in it would mean a bar
   * permanently on screen. A horizontal one appears for the pointer anywhere
   * over its box: those are code blocks and tables a few lines tall, where
   * "within 40px of the bottom" is most of the box anyway.
   */
  pointerNear(e: MouseEvent): void {
    if (!this.scroller || this.scrollRange <= 0) return;
    const box = this.scroller.getBoundingClientRect();
    const near = this.vertical
      ? box.right - e.clientX <= PROXIMITY_PX
      : e.clientY >= box.top && e.clientY <= box.bottom;

    if (near) {
      this.show();
    } else {
      this.hideSoonIfIdle();
    }
  }

  // ------------------------------------------------------------ thumb drag

  private pointerAlongAxis(e: MouseEvent): number {
    return this.vertical ? e.clientY : e.clientX;
  }

  thumbMouseDown(e: MouseEvent): void {
    if (!this.scroller) return;
    // Stop the press turning into a text selection that follows the drag.
    e.preventDefault();
    e.stopPropagation();

    this.dragging = true;
    this.dragPointerStart = this.pointerAlongAxis(e);
    this.dragScrollStart = this.scrollPosition;
    this.show();

    window.addEventListener("mousemove", this.onThumbMove);
    window.addEventListener("mouseup", this.onThumbUp);
  }

  thumbMouseMove(e: MouseEvent): void {
    if (!this.dragging || !this.scroller) return;
    e.preventDefault();

    // Same reason as a window drag, and raised on the move for the same reason
    // too: a thumb pulled past a cross-origin frame loses its moves to it, and
    // the scroll sticks with the thumb still held.
    raiseDragShim("pointer");

    const travel = Math.max(0, this.viewport - this.thumbLength);
    if (travel === 0) return;

    // Thumb pixels map onto content pixels by the ratio of their travels.
    const moved = this.pointerAlongAxis(e) - this.dragPointerStart;
    this.scrollPosition = clamp(
      this.dragScrollStart + (moved / travel) * this.scrollRange,
      0,
      this.scrollRange
    );
    this.sync();
  }

  thumbMouseUp(): void {
    this.dragging = false;
    dropDragShim();
    window.removeEventListener("mousemove", this.onThumbMove);
    window.removeEventListener("mouseup", this.onThumbUp);
    this.hideSoonIfIdle();
  }

  // ------------------------------------------------------------------ load

  async load(element: HTMLElement) {
    await super.load(element);

    // Geometry is only meaningful once the content has been laid out.
    setTimeout(() => {
      const el = this.scroller;
      if (!el) return;

      // Keep native scrolling; just take the platform bar out of the picture.
      if (this.vertical) el.style.overflowY = "auto";
      else el.style.overflowX = "auto";
      (el.style as any).scrollbarWidth = "none"; // Firefox
      el.classList.add("hide-native-scrollbar");

      this.sync();

      el.addEventListener("scroll", this.onScroll, { passive: true });
      el.addEventListener("mousemove", this.onPointerNear);
      el.addEventListener("mouseleave", this.onPointerLeave);
      this.thumb.addEventListener("mousedown", this.onThumbDown);

      // Content and window size both change; re-measure when they do.
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => this.sync());
        this.resizeObserver.observe(el);
        if (el.firstElementChild) this.resizeObserver.observe(el.firstElementChild);
      }
    }, 0);
  }

  /**
   * Taken out by hand rather than by the base class, which removes the element
   * from the parent it was given. A bar outlives nothing: the content it was
   * mounted beside is often thrown away first — a window's pane redrawn, a
   * README replaced — and asking a parent to remove a child it no longer has
   * throws. `remove()` on an element already gone is a no-op.
   */
  async unload(): Promise<void> {
    await this.beforeUnload();
    this.element.remove();
    this.parent = null;
    await this.afterUnload();
  }

  async beforeUnload(): Promise<void> {
    const el = this.scroller;
    if (el) {
      el.removeEventListener("scroll", this.onScroll);
      el.removeEventListener("mousemove", this.onPointerNear);
      el.removeEventListener("mouseleave", this.onPointerLeave);
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.thumb.removeEventListener("mousedown", this.onThumbDown);
    window.removeEventListener("mousemove", this.onThumbMove);
    window.removeEventListener("mouseup", this.onThumbUp);
  }
}

/**
 * Whether a track mounted here would stay where it was put.
 *
 * Two things are needed. The element has to be positioned, because the track is
 * absolute and reads its coordinates from the scrolling box's `offsetTop` and
 * `offsetLeft` — which are measured against the offset parent, so anything else
 * would put the bar somewhere else entirely. And it must not scroll itself, or
 * the track would slide away with the content it is describing.
 */
function canHost(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (!style.position || style.position === "static") return false;
  return !/auto|scroll/.test(`${style.overflowX} ${style.overflowY}`);
}

/**
 * A box for the track to live in, put around the scrolling element.
 *
 * Only used where the parent will not do — a code block in the middle of a
 * README, say, whose parent is the prose itself. Block-level and styleless
 * beyond being positioned, so it changes nothing about how the element inside
 * it is laid out.
 */
function hostFor(scroller: HTMLElement): HTMLElement {
  const parent = scroller.parentElement;
  if (parent && canHost(parent)) return parent;

  const host = document.createElement("div");
  host.className = "scroll-host";
  host.style.position = "relative";
  parent?.insertBefore(host, scroller);
  host.appendChild(scroller);
  return host;
}

/**
 * Give a scrolling element the desktop's bar, wherever it is.
 *
 * The one call every surface should use: it works out where the track can be
 * mounted, so nothing outside this file has to know that the track lives beside
 * the box rather than inside it.
 *
 * `host` is for the one case that cannot be worked out — an element that is not
 * in the document yet, where the browser will not report a computed position
 * for anything. A component mounting its own content knows the answer anyway,
 * so it says so rather than being made to wait until it is on screen.
 */
export function overlayScroll(
  scroller: HTMLElement,
  axis: Axis = "y",
  host?: HTMLElement
): ScrollBar {
  const bar = new ScrollBar(axis);
  bar.attachTo(scroller);
  void bar.load(host ?? hostFor(scroller));
  return bar;
}

/**
 * The bars belonging to a view that redraws itself.
 *
 * A pane that rebuilds its content on every render grows a new set of scrolling
 * boxes each time, and the bars pointed at the old ones are listening to
 * elements nobody can see any more. Kept together so a render can drop the lot
 * in one line before attaching the next.
 */
export class ScrollBars {
  private bars: ScrollBar[] = [];

  /** Every element in `root` matching `selector`, along the given axis. */
  attach(root: ParentNode, selector: string, axis: Axis = "y"): void {
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      this.bars.push(overlayScroll(el, axis));
    });
  }

  /** Redraw them all — content changed without the box changing size. */
  sync(): void {
    this.bars.forEach((bar) => bar.sync());
  }

  clear(): void {
    this.bars.forEach((bar) => void bar.unload());
    this.bars = [];
  }
}

export { ScrollBar as default };
