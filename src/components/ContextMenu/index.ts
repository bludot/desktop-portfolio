import OSElement from "../../utils/OSElement";
import { color, font, radius, size, weight } from "../../theme";
import { motion } from "../../utils/motion";

/**
 * The menu that opens under the pointer.
 *
 * One instance for the whole desktop rather than one per surface: only one
 * context menu can ever be open, and a single element mounted beside the
 * windows escapes every window's `overflow: hidden`, transform and stacking
 * context — the same reason the selection layer lives where it does.
 *
 * Surfaces do not build menus themselves. They call `bindContextMenu` with a
 * function that returns items, and it is called at the moment of the press, so
 * a menu always describes the window as it is right now rather than as it was
 * when the handler was attached.
 */

export interface MenuItem {
  label: string;
  /**
   * Handed the press that ran it, so an action that wants to animate out of
   * where it was chosen — the theme swap does — has somewhere to start from.
   */
  onPress?: (event: MouseEvent) => void | Promise<void>;
  /** Shown, but not selectable — a menu that loses items is harder to learn. */
  disabled?: boolean;
  /** Draws a tick in the leading slot. */
  checked?: boolean;
  /** Right-aligned hint, e.g. "Esc". Never a control of its own. */
  shortcut?: string;
  /** Draws a hairline before this item. */
  separated?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

/** Kept from the edges of the screen. */
const MARGIN = 8;

/**
 * Where the menu goes, given the pointer, its size and the viewport.
 *
 * Down and to the right of the cursor, which is what every desktop does, and
 * flipped rather than nudged when there is no room: sliding a menu back onto
 * the screen would leave it sitting under the pointer, so the item beneath the
 * cursor would be armed the instant it appeared.
 *
 * Pure, so the awkward cases — a press in the bottom-right corner, a menu
 * taller than the screen — can be checked without laying anything out.
 */
export function placeMenu(
  point: Point,
  panel: { width: number; height: number },
  viewport: { width: number; height: number }
): { left: number; top: number; origin: string } {
  const flipX = point.x + panel.width > viewport.width - MARGIN;
  const flipY = point.y + panel.height > viewport.height - MARGIN;

  const clamp = (value: number, extent: number, limit: number) =>
    Math.min(Math.max(MARGIN, value), Math.max(MARGIN, limit - extent - MARGIN));

  return {
    // Clamped after flipping, for the menu that fits neither way.
    left: clamp(
      flipX ? point.x - panel.width : point.x,
      panel.width,
      viewport.width
    ),
    top: clamp(
      flipY ? point.y - panel.height : point.y,
      panel.height,
      viewport.height
    ),
    // The corner it grew from, so the opening scale reads as coming from the
    // pointer rather than from the middle of the panel.
    origin: `${flipX ? "right" : "left"} ${flipY ? "bottom" : "top"}`
  };
}

const TICK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>`;

class ContextMenu extends OSElement {
  private open = false;
  private items: HTMLButtonElement[] = [];

  constructor() {
    super("contextmenu", "context-menu");

    this.style = () => ({
      [this.id]: {
        position: "fixed",
        display: "none",
        minWidth: "196px",
        maxWidth: "280px",
        padding: "5px",
        // The corner setting reaches this the same way it reaches a window.
        borderRadius: radius.control,
        background: color.chromeRaised,
        boxShadow: `0 18px 40px -16px rgba(0, 0, 0, .5), inset 0 0 0 1px ${color.line}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        fontFamily: font.ui,
        // Above the windows and the taskbar, below the overview.
        zIndex: "8200",
        "&.is-open": {
          display: "block"
        },
        "& .menu-item": {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          padding: "6px 10px 6px 8px",
          border: "0",
          background: "none",
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          color: color.inkSoft,
          textAlign: "left",
          borderRadius: radius.chip,
          cursor: "pointer",
          whiteSpace: "nowrap"
        },
        "& .menu-item:hover, & .menu-item:focus-visible": {
          background: color.hover,
          color: color.ink,
          // The hover wash is the highlight; a focus ring on top of it would be
          // two marks saying the same thing.
          outline: "none"
        },
        "& .menu-item[aria-disabled='true']": {
          color: color.inkFaint,
          cursor: "default"
        },
        "& .menu-item[aria-disabled='true']:hover": {
          background: "none",
          color: color.inkFaint
        },
        // A fixed slot, occupied or not, so labels line up whether or not
        // anything in the menu is checkable.
        "& .menu-tick": {
          width: "14px",
          height: "14px",
          flex: "0 0 auto",
          color: color.accent
        },
        "& .menu-label": {
          flex: "1 1 auto",
          overflow: "hidden",
          textOverflow: "ellipsis"
        },
        "& .menu-shortcut": {
          flex: "0 0 auto",
          paddingLeft: "18px",
          fontFamily: font.mono,
          fontSize: size.micro,
          color: color.inkFaint
        },
        "& .menu-divider": {
          height: "1px",
          margin: "5px 8px",
          background: color.line
        }
      }
    });
  }

  isOpen(): boolean {
    return this.open;
  }

  /**
   * Show the menu at a point.
   *
   * Mounts itself if it has not been mounted, so a surface can offer a menu
   * without knowing who is responsible for putting the layer on the page.
   */
  async show(point: Point, items: MenuItem[], host?: HTMLElement) {
    if (!items.length) return;
    if (!this.parent) {
      const target =
        host ?? (document.querySelector("#app") as HTMLElement | null);
      if (!target) return;
      await this.load(target);
    }

    this.render(items);

    // Shown before measuring: a display:none panel has no size to place by.
    this.element.classList.add("is-open");
    this.open = true;

    const { left, top, origin } = placeMenu(
      point,
      { width: this.element.offsetWidth, height: this.element.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight }
    );
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    this.element.style.transformOrigin = origin;

    this.listen();
    void motion.menuIn(this.element);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.element.classList.remove("is-open");
    this.unlisten();
  }

  private render(items: MenuItem[]) {
    this.element.textContent = "";
    this.items = [];
    this.element.setAttribute("role", "menu");

    items.forEach((item) => {
      if (item.separated && this.items.length) {
        const divider = document.createElement("div");
        divider.className = "menu-divider";
        divider.setAttribute("aria-hidden", "true");
        this.element.appendChild(divider);
      }

      const button = document.createElement("button");
      button.className = "menu-item";
      button.type = "button";
      button.setAttribute("role", "menuitem");
      if (item.disabled) button.setAttribute("aria-disabled", "true");
      if (item.checked !== undefined) {
        button.setAttribute("aria-checked", String(item.checked));
        button.setAttribute("role", "menuitemcheckbox");
      }

      const tick = document.createElement("span");
      tick.className = "menu-tick";
      tick.setAttribute("aria-hidden", "true");
      if (item.checked) {
        tick.appendChild(
          new DOMParser().parseFromString(TICK, "image/svg+xml").documentElement
        );
      }
      button.appendChild(tick);

      const label = document.createElement("span");
      label.className = "menu-label";
      label.appendChild(document.createTextNode(item.label));
      button.appendChild(label);

      if (item.shortcut) {
        const shortcut = document.createElement("span");
        shortcut.className = "menu-shortcut";
        shortcut.appendChild(document.createTextNode(item.shortcut));
        button.appendChild(shortcut);
      }

      button.addEventListener("click", (event) => {
        if (item.disabled) return;
        // Closed before the action runs, not after. Several of these close or
        // minimise the window the menu was opened from, and a menu still on
        // screen while that happens is left pointing at nothing.
        this.close();
        void item.onPress?.(event);
      });

      this.element.appendChild(button);
      if (!item.disabled) this.items.push(button);
    });
  }

  /*
   * Everything that should dismiss a menu.
   *
   * Registered on open and removed on close rather than living for the life of
   * the page: this runs on capture at the window, and a menu is open for a
   * second at a time.
   */
  private listen() {
    window.addEventListener("mousedown", this.onPointerDown, true);
    window.addEventListener("contextmenu", this.onContextMenu, true);
    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("blur", this.onClose);
    window.addEventListener("resize", this.onClose);
    // Capture, because the scroll that matters is inside a window's content
    // pane and scroll does not bubble.
    window.addEventListener("scroll", this.onClose, true);
  }

  private unlisten() {
    window.removeEventListener("mousedown", this.onPointerDown, true);
    window.removeEventListener("contextmenu", this.onContextMenu, true);
    window.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("blur", this.onClose);
    window.removeEventListener("resize", this.onClose);
    window.removeEventListener("scroll", this.onClose, true);
  }

  private onClose = () => this.close();

  private onPointerDown = (e: MouseEvent) => {
    const target = e.target instanceof Node ? e.target : null;
    // A press on the menu is a press on an item; the click that follows will
    // run the action and close it.
    if (target && this.element.contains(target)) return;
    this.close();
  };

  /*
   * A second right-click closes this menu, and the surface it landed on then
   * opens its own. Capture at the window runs before the event reaches that
   * surface, so the close cannot swallow the open that follows it.
   */
  private onContextMenu = () => this.close();

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
      case "Tab":
        e.preventDefault();
        this.close();
        return;
      case "ArrowDown":
        e.preventDefault();
        this.move(1);
        return;
      case "ArrowUp":
        e.preventDefault();
        this.move(-1);
        return;
      case "Home":
        e.preventDefault();
        this.items[0]?.focus();
        return;
      case "End":
        e.preventDefault();
        this.items[this.items.length - 1]?.focus();
        return;
      default:
    }
  };

  /**
   * Move the highlight, wrapping at both ends.
   *
   * Nothing is focused when a menu opens under the pointer — that is a mouse
   * gesture, and pre-selecting an item would arm whatever the first one happens
   * to be. The first arrow key is what turns it into a keyboard menu.
   */
  private move(delta: number) {
    if (!this.items.length) return;
    const current = this.items.indexOf(
      document.activeElement as HTMLButtonElement
    );
    const next =
      current === -1
        ? delta > 0
          ? 0
          : this.items.length - 1
        : (current + delta + this.items.length) % this.items.length;
    this.items[next].focus();
  }
}

const contextMenu = new ContextMenu();

/**
 * Give an element a context menu.
 *
 * `build` runs at the moment of the press and may return an empty list, in
 * which case the browser's own menu is left alone — right-clicking a link or a
 * paragraph should still do what it does everywhere else. Returning items is
 * what claims the gesture.
 */
export function bindContextMenu(
  element: HTMLElement,
  build: (e: MouseEvent) => MenuItem[]
): () => void {
  const handler = (event: Event) => {
    const e = event as MouseEvent;
    const items = build(e);
    if (!items.length) return;
    e.preventDefault();
    e.stopPropagation();
    void contextMenu.show({ x: e.clientX, y: e.clientY }, items);
  };

  element.addEventListener("contextmenu", handler);
  return () => element.removeEventListener("contextmenu", handler);
}

export default contextMenu;
export { ContextMenu };
