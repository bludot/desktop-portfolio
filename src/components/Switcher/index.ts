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
  /** Where the tile sits in the scrolling content, for culling. */
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
  private spacer!: HTMLElement;
  private empty!: HTMLElement;
  private tiles: Tile[] = [];
  private open = false;
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

    // Gives the scroll container something to scroll; the tiles themselves are
    // positioned absolutely and contribute no height of their own.
    this.spacer = document.createElement("div");
    this.spacer.className = "switcher-spacer";
    this.spacer.setAttribute("aria-hidden", "true");
    this.grid.appendChild(this.spacer);

    this.empty = document.createElement("p");
    this.empty.className = "switcher-empty";
    this.empty.appendChild(document.createTextNode("No open windows"));
    this.element.appendChild(this.empty);

    // The grid fills the overlay, so a click on empty space lands on it rather
    // than on the backdrop behind it. Either one counts as dismissing.
    const onBackdrop = (e: Event) => {
      if (e.target === this.element || e.target === this.grid) void this.close();
    };
    this.element.addEventListener("click", onBackdrop);
    this.grid.addEventListener("scroll", this.onScroll, { passive: true });

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
        "& > .switcher-grid": {
          position: "absolute",
          inset: "0",
          overflowX: "hidden",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          // No visible bar: the cards are the affordance, and a scrollbar drawn
          // over the tiles would read as belonging to one of the windows.
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" }
        },
        "& .switcher-spacer": {
          width: "1px",
          pointerEvents: "none"
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

  private transformFor(tile: Tile, scrollTop: number) {
    return `translate(${tile.dx}px, ${tile.dy - scrollTop}px) scale(${tile.scale})`;
  }

  /**
   * Windows are fixed-position, so scrolling the container does not move them.
   * Their offset is rewritten instead, and anything scrolled out of the band is
   * hidden — otherwise it would still be sitting over the taskbar.
   */
  private onScroll = () => {
    if (!this.open) return;
    const scrollTop = this.grid.scrollTop;
    const viewportHeight = this.grid.clientHeight;

    this.tiles.forEach((tile) => {
      tile.element.style.transform = this.transformFor(tile, scrollTop);
      const offscreen =
        tile.top + tile.height - scrollTop < 0 ||
        tile.top - scrollTop > viewportHeight;
      tile.element.style.visibility = offscreen ? "hidden" : "";
    });
  };

  private clearTiles() {
    [...this.grid.querySelectorAll(".switcher-tile")].forEach((t) => t.remove());
  }

  async show(host: HTMLElement) {
    if (this.open) return;
    const windows = windowManager.list();
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

    this.grid.scrollTop = 0;
    this.spacer.style.height = `${contentHeight}px`;
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

      this.grid.appendChild(
        this.buildTile(title, cell, boxHeight, () => void this.pick(win))
      );

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
    this.tiles.forEach((tile) => {
      clearAnimations(tile.element);
      tile.element.style.transform = this.transformFor(tile, 0);
    });
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
    window.removeEventListener("keydown", this.onKeyDown, true);

    const tiles = this.tiles;
    this.tiles = [];
    const scrollTop = this.grid.scrollTop;

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
            { transform: this.transformFor(tile, scrollTop) },
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
