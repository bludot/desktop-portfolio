import Logger from "../../Logger";
import OSElement from "../../utils/OSElement";
import Taskbar from "./../Taskbar";
import SelectionLayer from "../Selection";
import contextMenu, { bindContextMenu } from "../ContextMenu";
import { desktopMenuItems } from "../ContextMenu/menus";
import windowManager from "../../utils/windowManager";
import appearance from "../../utils/appearance";
import { saveSettings } from "../../Store";
import SettingsApp from "../../apps/Settings";

const logger = new Logger("Desktop");

/**
 * The sky comes from the theme engine.
 *
 * The bands and the glow are drawn rather than photographed — a photograph
 * competes with every window placed on it and has to be loaded — and their
 * colours are tokens, so changing wallpaper or theme is a variable swap with
 * nothing here to rebuild. Only the shapes stay fixed.
 */
const RIDGES = [
  {
    height: "42%",
    borderRadius: "46% 54% 0 0 / 74% 68% 0 0",
    transform: "none"
  },
  {
    height: "30%",
    borderRadius: "62% 38% 0 0 / 82% 62% 0 0",
    transform: "translateX(-14%) scaleX(1.5)"
  },
  {
    height: "19%",
    borderRadius: "34% 66% 0 0 / 70% 78% 0 0",
    transform: "translateX(12%) scaleX(1.45)"
  }
];

class Desktop extends OSElement {
  mainElement: HTMLElement;
  element!: HTMLElement;
  id!: string;
  backgroundColor: string;
  taskbar: Taskbar;
  selection: SelectionLayer;
  instanceName: string = "Desktop";

  constructor({
    backgroundColor = "#EEEEEE",
    mainElement = document.body,
  }: {
    backgroundColor: string;
    mainElement: HTMLElement;
  }) {
    super("desktop", "desktop", "Desktop");
    this.mainElement = mainElement;
    this.backgroundColor = backgroundColor;
    this.taskbar = new Taskbar(this);
    this.selection = new SelectionLayer();

    // Sun first, then ridges back to front, so they layer correctly.
    const sun = document.createElement("div");
    sun.className = "desktop-sun";
    sun.setAttribute("aria-hidden", "true");
    this.element.appendChild(sun);

    RIDGES.forEach((_, i) => {
      const ridge = document.createElement("div");
      ridge.className = `desktop-ridge desktop-ridge-${i}`;
      ridge.setAttribute("aria-hidden", "true");
      this.element.appendChild(ridge);
    });

    this.style = () => ({
      [this.id]: {
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--wallpaper-sky)",
        zIndex: "1",
        overflow: "hidden",
        "& > .desktop-sun": {
          position: "absolute",
          top: "12%",
          right: "18%",
          width: "190px",
          height: "190px",
          borderRadius: "50%",
          background: "var(--wallpaper-sun)",
          pointerEvents: "none"
        },
        "& > .desktop-ridge": {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none"
        },
        ...RIDGES.reduce(
          (acc, ridge, i) => ({
            ...acc,
            [`& > .desktop-ridge-${i}`]: {
              height: ridge.height,
              background: `var(--wallpaper-ridge-${i})`,
              borderRadius: ridge.borderRadius,
              transform: ridge.transform
            }
          }),
          {}
        )
      },
    });
  }

  getTaskbar() {
    return this.taskbar;
  }

  /**
   * The menu on the wallpaper.
   *
   * Bound to the desktop element and tested against it exactly, rather than
   * filtered by what the press landed on: windows are children of the desktop,
   * so a right-click anywhere in one bubbles to here. The sky and the ridges
   * take no pointer events, which leaves this element as the only thing a press
   * on the background can be aimed at.
   */
  private bindMenu() {
    bindContextMenu(this.element, (e) => {
      if (e.target !== this.element) return [];

      const open = windowManager.list();
      const onScreen = open.filter((w) => !w.minimized);

      return desktopMenuItems(
        {
          dark: appearance.scheme() === "dark",
          open: open.length,
          onScreen: onScreen.length
        },
        {
          /*
           * Straight to the other scheme, not through "system": picking a side
           * here is picking a side, and leaving it following the OS would let
           * the choice undo itself the next time the OS changed its mind.
           *
           * Written down as well as applied. `appearance.set` only repaints —
           * persisting is the caller's job, as it is in the Settings window —
           * so without this the theme would go back on the next reload, which
           * is not what flipping a switch means.
           */
          toggleTheme: () => {
            appearance.set({
              theme: appearance.scheme() === "dark" ? "light" : "dark"
            });
            void saveSettings(appearance.get());
          },
          showAll: () => void this.taskbar.showOverview(this.mainElement),
          minimizeAll: () =>
            onScreen.forEach((open) => void open.window.minimize()),
          settings: () => void new SettingsApp(this).load()
        }
      );
    });
  }

  async load(element: HTMLElement) {
    await super.load(element);
  }

  async startup(bootscreen: {
    unload: () => Promise<void>;
    complete?: () => Promise<void>;
  }) {
    logger.debug("Starting desktop");
    this.mainElement.appendChild(this.element);
    this.taskbar.load(this.element);
    // Mounted beside the desktop rather than inside it: selection rectangles
    // are viewport coordinates, and a parent that clips or transforms would
    // move every shape away from the text it belongs to.
    await this.selection.load(this.mainElement);
    /*
     * Beside the desktop rather than inside it, for the same reason: the menu
     * is placed in viewport coordinates, and the desktop clips its overflow and
     * is the element the overview scales. A menu mounted inside it would be
     * cut off at its edges and would drift the moment anything moved it.
     */
    await contextMenu.load(this.mainElement);
    this.bindMenu();
    await this.applyStyle();
    // Let the boot sequence finish before it fades; the desktop is already
    // built behind it, so this costs nothing but the animation.
    await bootscreen.complete?.();
    await bootscreen.unload();
  }
}

export default Desktop;
