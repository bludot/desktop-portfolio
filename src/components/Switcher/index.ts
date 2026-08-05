import OSElement from "../../utils/OSElement";
import windowManager from "../../utils/windowManager";
import type OSWindow from "../Window";
import { clearAnimations, play } from "../../utils/motion";
import {
  color,
  font,
  motion as motionToken,
  radius,
  size,
  tracking,
  weight
} from "../../theme";
import { NARROW_PX, getWindowHeight, getWindowWidth } from "../../utils/utils";

/**
 * The window overview.
 *
 * Every open window pulls back into a tile at once, so the whole desktop is
 * legible in a glance and you pick the one you want. The real windows are the
 * tiles — they are transformed into place rather than screenshotted into
 * thumbnails, so live content keeps updating and there is nothing to keep in
 * sync.
 *
 * On a narrow viewport the same overview is the primary way to change windows,
 * since there is no room for a chip per window in the taskbar. It lays out as
 * one or two large cards rather than a square grid, and scrolls once there are
 * more than fit.
 */

const GAP = 22;
const PAD = 34;
/** Room under each tile for its title. */
const LABEL_H = 26;
/**
 * Rows kept on screen at once on a phone. Past this the tiles would be too
 * small to tell apart, so the overview scrolls rather than shrinking further —
 * with two columns that is four windows before scrolling starts.
 */
const NARROW_VISIBLE_ROWS = 2;
/** Movement past which a gesture is a pan, not a tap on a card. */
const TAP_SLOP = 8;
const GLIDE_DECAY = 0.94;
const MIN_GLIDE = 0.4;
/**
 * Ceiling on a tile, so the overview reads as one.
 *
 * Cells sized purely by dividing the screen are enormous when only two windows
 * are open — every window fits at full size, nothing appears to move, and the
 * result looks like a dimmed desktop rather than a step back from it. Capping
 * the tile forces a real reduction and leaves the grid floating in space.
 */
const MAX_TILE = { width: 480, height: 380 };

interface Cell {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Tile {
  window: OSWindow;
  element: HTMLElement;
  /** Inline styles to be handed back untouched on close. */
  previousTransform: string;
  previousTransformOrigin: string;
  previousPointerEvents: string;
  previousVisibility: string;
  /** Offset from the element's layout box to its place in the overview. */
  dx: number;
  dy: number;
  scale: number;
  /** Where the tile sits in the scrolling content. */
  top: number;
  height: number;
}

/**
 * Columns for `count` tiles. A square-ish grid on the desktop; on a phone,
 * fewer and larger, closer to a stack of cards than a mosaic.
 */
export function columnsFor(count: number, narrow: boolean): number {
  if (count <= 1) return 1;
  if (narrow) return count <= 2 ? 1 : 2;
  return Math.ceil(Math.sqrt(count));
}

/**
 * Where each tile goes, in the overview's own coordinates, plus how tall the
 * content is. Pure, so the layout can be checked without a desktop behind it.
 */
export function layoutCells(
  count: number,
  area: { width: number; height: number }
): { cells: Cell[]; contentHeight: number } {
  const narrow = area.width <= NARROW_PX;
  const cols = columnsFor(count, narrow);
  const rows = Math.ceil(count / cols) || 1;

  // Rows are sized to what should be visible, not to how many there are, so
  // the ones past the fold keep the same height instead of squashing.
  const visibleRows = narrow ? Math.min(rows, NARROW_VISIBLE_ROWS) : rows;
  const available = {
    width: (area.width - PAD * 2 - GAP * (cols - 1)) / cols,
    height: (area.height - PAD * 2 - GAP * (visibleRows - 1)) / visibleRows
  };

  // A phone wants the biggest card it can get; a desktop wants a grid that
  // reads as an overview rather than as the windows where they already were.
  const cellWidth = narrow
    ? available.width
    : Math.min(available.width, MAX_TILE.width);
  const cellHeight = narrow
    ? available.height
    : Math.min(available.height, MAX_TILE.height);

  // Centre whatever the grid came out as, rather than anchoring it top-left.
  const blockWidth = cols * cellWidth + GAP * (cols - 1);
  const blockHeight = rows * cellHeight + GAP * (rows - 1);
  const originX = Math.max(PAD, (area.width - blockWidth) / 2);
  const originY = narrow
    ? PAD
    : Math.max(PAD, (area.height - blockHeight) / 2);

  const cells = Array.from({ length: count }, (_, i) => ({
    left: originX + (i % cols) * (cellWidth + GAP),
    top: originY + Math.floor(i / cols) * (cellHeight + GAP),
    width: cellWidth,
    height: cellHeight
  }));

  return { cells, contentHeight: originY + blockHeight + PAD };
}

class Switcher extends OSElement {
  private grid!: HTMLElement;
  private empty!: HTMLElement;
  private tiles: Tile[] = [];
  private open = false;
  /** How far the overview is panned, and how far it may pan. */
  private offset = 0;
  private maxOffset = 0;
  /** The band a tile has to fall inside to be worth showing. */
  private viewportHeight = 0;
  private momentum?: ReturnType<typeof requestAnimationFrame>;
  private taskbarHeight: () => number;
  private scrimHost: () => HTMLElement;
  private scrim: HTMLElement;

  constructor(options: {
    taskbarHeight: () => number;
    scrimHost: () => HTMLElement;
  }) {
    super("switcher", "switcher", "Switcher");
    this.taskbarHeight = options.taskbarHeight;
    this.scrimHost = options.scrimHost;

    /*
     * The dim, mounted behind the windows rather than in front of them.
     *
     * It lives on the desktop instead of in this overlay because the whole
     * point is that the windows stay crisp: anything drawn over them reads as
     * a sheet of glass laid on the screen, which is the opposite of the
     * desktop stepping back.
     */
    this.scrim = document.createElement("div");
    this.scrim.className = "switcher-scrim";
    this.scrim.setAttribute("aria-hidden", "true");
    this.scrim.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 0;
      background: rgba(38, 30, 46, .55);
      pointer-events: none;
      opacity: 0;
    `;
    /*
     * Its resting opacity is always an inline value, set once the transition
     * has played, never a filled animation left holding the last keyframe.
     * A fill outranks inline styles, so a stale one would keep the desktop
     * dimmed after the overview had closed.
     */

    this.grid = document.createElement("div");
    this.grid.className = "switcher-grid";
    this.element.appendChild(this.grid);

    this.empty = document.createElement("p");
    this.empty.className = "switcher-empty";
    this.empty.appendChild(document.createTextNode("No open windows"));
    this.element.appendChild(this.empty);

    // The grid fills the overlay, so a click on empty space lands on it rather
    // than on the backdrop behind it. Either one counts as dismissing.
    const onBackdrop = (e: Event) => {
      if (e.target === this.element || e.target === this.grid) void this.close();
    };
    this.element.addEventListener("click", onBackdrop, true);
    this.element.addEventListener("wheel", this.onWheel, { passive: false });
    this.element.addEventListener("pointerdown", this.onPointerDown);

    this.style = () => ({
      [this.id]: {
        position: "fixed",
        inset: "0",
        // Above every window. Windows raise themselves as they take focus, so
        // this has to clear whatever they have reached.
        zIndex: "9000",
        /*
         * Deliberately transparent. The dim lives in a scrim behind the
         * windows instead — tinting and blurring on top of them put a sheet of
         * glass over the very things you are trying to pick out.
         */
        font: `${size.body}/1.4 ${font.ui}`,
        // Panned as a whole. Nothing here scrolls natively — see onWheel.
        "& > .switcher-grid": {
          position: "absolute",
          inset: "0",
          overflow: "hidden",
          willChange: "transform",
          touchAction: "none"
        },
        "& .switcher-tile": {
          position: "absolute",
          margin: "0",
          padding: "0",
          border: "0",
          background: "none",
          cursor: "pointer",
          display: "flex",
          flexFlow: "column nowrap",
          justifyContent: "flex-end",
          font: "inherit"
        },
        // Sits over the window it belongs to and takes the click, so the
        // window's own controls cannot be hit by mistake from the overview.
        "& .switcher-hit": {
          flex: "1 1 auto",
          borderRadius: radius.window,
          transition: `box-shadow ${motionToken.fast}ms ${motionToken.standard}`
        },
        "& .switcher-tile:hover .switcher-hit, & .switcher-tile:focus-visible .switcher-hit":
          {
            boxShadow: `0 0 0 2px ${color.accent}`
          },
        "& .switcher-tile:focus-visible": {
          outline: "none"
        },
        "& .switcher-label": {
          height: `${LABEL_H}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          letterSpacing: tracking.heading,
          textShadow: "0 1px 3px rgba(43, 37, 48, .5)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        },
        "& .switcher-empty": {
          position: "absolute",
          inset: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0",
          color: "#fff",
          fontSize: size.small,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          textShadow: "0 1px 3px rgba(43, 37, 48, .5)",
          pointerEvents: "none"
        }
      }
    });
  }

  isOpen() {
    return this.open;
  }

  private transformFor(tile: Tile, offset: number) {
    return `translate(${tile.dx}px, ${tile.dy - offset}px) scale(${tile.scale})`;
  }

  /*
   * The overview is panned by hand rather than by a native scroller.
   *
   * The windows are fixed-position, so no container can scroll them — their
   * offset always has to be written from script. Letting the tiles scroll
   * natively alongside that put the two on different clocks: the tiles moved
   * on the compositor while the windows waited for a scroll event, and each
   * label ran ahead of the window it named. Making the tiles fixed too fixed
   * the drift but broke scrolling outright, because a gesture over a
   * fixed-position element scrolls the viewport, not the container it happens
   * to sit inside — and on a phone the cards cover the screen, so almost every
   * swipe landed on one.
   *
   * So there is one offset, applied to the tile layer and to every window in
   * the same pass. They cannot drift, and the gesture is read from the overlay
   * itself, which is above everything and therefore never missed.
   */

  private setOffset(next: number) {
    this.offset = Math.max(0, Math.min(next, this.maxOffset));
    this.applyOffset();
  }

  private applyOffset() {
    // One transform for every tile, rather than a write per element.
    this.grid.style.transform = `translateY(${-this.offset}px)`;

    this.tiles.forEach((tile) => {
      tile.element.style.transform = this.transformFor(tile, this.offset);
      // Nothing off the top or bottom should still be sitting over the taskbar.
      const offscreen =
        tile.top + tile.height - this.offset < 0 ||
        tile.top - this.offset > this.viewportHeight;
      tile.element.style.visibility = offscreen ? "hidden" : "";
    });
  }

  private stopMomentum() {
    if (this.momentum === undefined) return;
    cancelAnimationFrame(this.momentum);
    this.momentum = undefined;
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.open || this.maxOffset === 0) return;
    // The overview is modal, so the page behind it must not scroll as well.
    e.preventDefault();
    this.stopMomentum();
    this.setOffset(this.offset + e.deltaY);
  };

  private onPointerDown = (e: PointerEvent) => {
    if (!this.open || this.maxOffset === 0 || e.button !== 0) return;
    this.stopMomentum();

    let last = e.clientY;
    let velocity = 0;
    let travelled = 0;

    const onMove = (move: PointerEvent) => {
      const delta = move.clientY - last;
      last = move.clientY;
      travelled += Math.abs(delta);
      velocity = -delta;
      this.setOffset(this.offset - delta);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);

      /*
       * A drag is not a tap. Without this, letting go over a card would open
       * it, and letting go over empty space would dismiss the overview.
       *
       * Registered on window rather than on the overlay: window's capture
       * phase runs first, so this beats the overlay's own dismiss handler
       * instead of queueing up behind it.
       */
      if (travelled > TAP_SLOP) {
        window.addEventListener("click", swallow, { capture: true, once: true });
      }
      this.glide(velocity);
    };

    const swallow = (click: Event) => {
      click.stopPropagation();
      click.preventDefault();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  /** Carry on under its own weight after the finger leaves. */
  private glide(velocity: number) {
    if (Math.abs(velocity) < MIN_GLIDE) return;

    let speed = velocity;
    const step = () => {
      speed *= GLIDE_DECAY;
      const before = this.offset;
      this.setOffset(this.offset + speed);
      // Stop at the ends rather than grinding against them.
      if (Math.abs(speed) < MIN_GLIDE || this.offset === before) {
        this.momentum = undefined;
        return;
      }
      this.momentum = requestAnimationFrame(step);
    };
    this.momentum = requestAnimationFrame(step);
  }

  private clearTiles() {
    [...this.grid.querySelectorAll(".switcher-tile")].forEach((t) => t.remove());
  }

  async show(host: HTMLElement) {
    if (this.open) return;
    // A minimised window is display:none, so it measures zero and would take a
    // tile showing nothing. The overview is what is on screen.
    const windows = windowManager.list().filter((open) => !open.minimized);
    this.open = true;

    if (!this.parent) await this.load(host);
    if (!this.scrim.parentElement) this.scrimHost().appendChild(this.scrim);
    this.element.style.display = "";
    this.empty.style.display = windows.length ? "none" : "";

    const area = {
      width: getWindowWidth(),
      height: getWindowHeight() - this.taskbarHeight()
    };
    const { cells, contentHeight } = layoutCells(windows.length, area);

    this.stopMomentum();
    this.offset = 0;
    this.grid.style.transform = "translateY(0px)";
    this.maxOffset = Math.max(0, contentHeight - area.height);
    // Measured, not read back off the element: culling should not depend on
    // layout having been flushed.
    this.viewportHeight = area.height;
    this.clearTiles();

    this.tiles = windows.map(({ window: win, title }, i) => {
      const el = win.getElement();
      const cell = cells[i];
      // The window keeps its aspect ratio inside the cell; the label takes a
      // fixed strip underneath it.
      const boxHeight = Math.max(cell.height - LABEL_H, 1);

      const previousTransform = el.style.transform;

      /*
       * Measured with the element's own transform removed, so the target is
       * expressed against its layout box. A window that has been dragged
       * carries a translate, and composing on top of it would compound the
       * offset every time the overview opened.
       */
      el.style.transform = "none";
      const box = el.getBoundingClientRect();
      el.style.transform = previousTransform;

      const scale = Math.min(
        boxHeight / (box.height || 1),
        cell.width / (box.width || 1),
        1
      );

      // Laid out unscrolled; panning moves the whole layer, not each tile.
      this.grid.appendChild(
        this.buildTile(title, cell, boxHeight, () => void this.pick(win))
      );

      const tile: Tile = {
        window: win,
        element: el,
        previousTransform,
        previousTransformOrigin: el.style.transformOrigin,
        previousPointerEvents: el.style.pointerEvents,
        previousVisibility: el.style.visibility,
        dx: cell.left + (cell.width - box.width * scale) / 2 - box.left,
        dy: cell.top + (boxHeight - box.height * scale) / 2 - box.top,
        scale,
        top: cell.top,
        height: cell.height
      };

      el.style.transformOrigin = "0 0";
      // Clicks belong to the tile in front, not to the window's own controls.
      el.style.pointerEvents = "none";

      return tile;
    });

    window.addEventListener("keydown", this.onKeyDown, true);

    await Promise.all([
      play(this.scrim, [{ opacity: 0 }, { opacity: 1 }], {
        duration: motionToken.base
      }),
      ...this.tiles.map((tile) =>
        play(
          tile.element,
          [
            { transform: tile.previousTransform || "none" },
            { transform: this.transformFor(tile, 0) }
          ],
          { duration: motionToken.base, fill: "forwards" }
        )
      )
    ]);

    /*
     * Hand the tiles back to inline styles once they have arrived. A filled
     * animation outranks `style.transform`, so leaving one attached would
     * freeze every tile in place and scrolling would move nothing. This also
     * covers reduced motion, where the animation was skipped outright and the
     * tiles have to be placed directly.
     */
    if (!this.open) return;
    clearAnimations(this.scrim);
    this.scrim.style.opacity = "1";
    this.tiles.forEach((tile) => clearAnimations(tile.element));
    this.applyOffset();
  }

  private buildTile(
    title: string,
    cell: Cell,
    boxHeight: number,
    onPick: () => void
  ) {
    const tile = document.createElement("button");
    tile.className = "switcher-tile";
    tile.type = "button";
    tile.style.left = `${cell.left}px`;
    tile.style.top = `${cell.top}px`;
    tile.style.width = `${cell.width}px`;
    tile.style.height = `${cell.height}px`;
    tile.setAttribute("aria-label", `Switch to ${title}`);

    const hit = document.createElement("span");
    hit.className = "switcher-hit";
    hit.style.height = `${boxHeight}px`;
    tile.appendChild(hit);

    const label = document.createElement("span");
    label.className = "switcher-label";
    label.appendChild(document.createTextNode(title));
    tile.appendChild(label);

    tile.addEventListener("click", onPick);
    return tile;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      void this.close();
    }
  };

  private async pick(win: OSWindow) {
    await this.close();
    win.onActive(win);
  }

  /** Put every window back exactly where it was. */
  async close() {
    if (!this.open) return;
    this.open = false;
    this.stopMomentum();
    window.removeEventListener("keydown", this.onKeyDown, true);

    const tiles = this.tiles;
    this.tiles = [];
    const offset = this.offset;

    await Promise.all([
      play(this.scrim, [{ opacity: 1 }, { opacity: 0 }], {
        duration: motionToken.fast,
        easing: motionToken.exit,
        fill: "forwards"
      }),
      ...tiles.map((tile) =>
        play(
          tile.element,
          [
            { transform: this.transformFor(tile, offset) },
            { transform: tile.previousTransform || "none" }
          ],
          { duration: motionToken.fast, easing: motionToken.exit }
        )
      )
    ]);

    tiles.forEach((tile) => {
      // Same reason as on the way in: a filled animation would outrank the
      // inline transform and dragging the window would stop working.
      clearAnimations(tile.element);
      tile.element.style.transform = tile.previousTransform;
      tile.element.style.transformOrigin = tile.previousTransformOrigin;
      tile.element.style.pointerEvents = tile.previousPointerEvents;
      tile.element.style.visibility = tile.previousVisibility;
    });

    this.clearTiles();
    this.element.style.display = "none";
    clearAnimations(this.scrim);
    this.scrim.style.opacity = "0";
  }

  async toggle(host: HTMLElement) {
    return this.open ? this.close() : this.show(host);
  }
}

export default Switcher;
