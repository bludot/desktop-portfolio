import debounce from "../../utils/debounce";
import OSElement from "../../utils/OSElement";

/** How close the pointer must get to the right edge before the bar appears. */
const PROXIMITY_PX = 40;
/** Never shrink the thumb below this, or long documents give you nothing to grab. */
const MIN_THUMB_PX = 24;
const TRACK_WIDTH_PX = 10;
const HIDE_AFTER_MS = 1000;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
 * back into view as the content moves.
 */
class ScrollBar extends OSElement {
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

  constructor() {
    super("scrollbar", "scrollbar");

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
        right: 0,
        opacity: 0,
        width: `${TRACK_WIDTH_PX}px`,
        zIndex: "2",
        transition: "opacity 200ms",
        userSelect: "none",
        // The bar floats over the content; clicks that miss the thumb should
        // reach whatever is underneath.
        pointerEvents: "none",
        "& > .bar": {
          position: "relative",
          width: `${TRACK_WIDTH_PX}px`,
          borderRadius: `${TRACK_WIDTH_PX / 2}px`,
          backgroundColor: "rgba(90,90,90,.45)",
          cursor: "pointer",
          pointerEvents: "auto",
          transition: "background-color 150ms",
          "&:hover": {
            backgroundColor: "rgba(60,60,60,.7)"
          }
        }
      }
    });
  }

  /** Point the bar at the element whose native scrolling it should mirror. */
  attachTo(scroller: HTMLElement): void {
    this.scroller = scroller;
  }

  // ---------------------------------------------------------------- geometry

  private get scrollRange(): number {
    const el = this.scroller;
    if (!el) return 0;
    return Math.max(0, el.scrollHeight - el.clientHeight);
  }

  private get thumbHeight(): number {
    const el = this.scroller;
    if (!el || el.scrollHeight <= 0) return MIN_THUMB_PX;
    const proportional = (el.clientHeight / el.scrollHeight) * el.clientHeight;
    return clamp(proportional, MIN_THUMB_PX, el.clientHeight);
  }

  /** Redraw track and thumb from the container's current scroll position. */
  sync(): void {
    const el = this.scroller;
    if (!el) return;

    const viewport = el.clientHeight;
    const thumbHeight = this.thumbHeight;
    const travel = Math.max(0, viewport - thumbHeight);
    const progress = this.scrollRange > 0 ? el.scrollTop / this.scrollRange : 0;

    // Line the track up with the scrolling box inside the window.
    this.element.style.top = `${el.offsetTop}px`;
    this.element.style.height = `${viewport}px`;

    this.thumb.style.height = `${thumbHeight}px`;
    this.thumb.style.top = `${clamp(progress, 0, 1) * travel}px`;

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

  /** Reveal the bar when the pointer comes near the right edge. */
  pointerNear(e: MouseEvent): void {
    if (!this.scroller || this.scrollRange <= 0) return;
    const { right } = this.scroller.getBoundingClientRect();
    if (right - e.clientX <= PROXIMITY_PX) {
      this.show();
    } else {
      this.hideSoonIfIdle();
    }
  }

  // ------------------------------------------------------------ thumb drag

  thumbMouseDown(e: MouseEvent): void {
    if (!this.scroller) return;
    // Stop the press turning into a text selection that follows the drag.
    e.preventDefault();
    e.stopPropagation();

    this.dragging = true;
    this.dragPointerStart = e.clientY;
    this.dragScrollStart = this.scroller.scrollTop;
    this.show();

    window.addEventListener("mousemove", this.onThumbMove);
    window.addEventListener("mouseup", this.onThumbUp);
  }

  thumbMouseMove(e: MouseEvent): void {
    if (!this.dragging || !this.scroller) return;
    e.preventDefault();

    const travel = Math.max(0, this.scroller.clientHeight - this.thumbHeight);
    if (travel === 0) return;

    // Thumb pixels map onto content pixels by the ratio of their travels.
    const moved = e.clientY - this.dragPointerStart;
    this.scroller.scrollTop = clamp(
      this.dragScrollStart + (moved / travel) * this.scrollRange,
      0,
      this.scrollRange
    );
    this.sync();
  }

  thumbMouseUp(): void {
    this.dragging = false;
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
      el.style.overflowY = "auto";
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

export { ScrollBar as default };
