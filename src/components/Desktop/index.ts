import Logger from "../../Logger";
import OSElement from "../../utils/OSElement";
import Taskbar from "./../Taskbar";
import SelectionLayer from "../Selection";
import contextMenu, { bindContextMenu, type MenuItem } from "../ContextMenu";
import { desktopMenuItems } from "../ContextMenu/menus";
import windowManager from "../../utils/windowManager";
import { centreOf, swapAppearance } from "../../utils/motion";
import appearance from "../../utils/appearance";
import { saveSettings } from "../../Store";
import SettingsApp from "../../apps/Settings";
import Launcher from "../Launcher";
import ProjectsContent from "../../contents/projects";
import type { Repo } from "../../utils/github";

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
  /** Kept so the backstop can be taken off the document again. */
  private unbindFallback?: () => void;
  launcher!: Launcher;

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
   * The menu on the wallpaper, and the one under everything else.
   *
   * Bound twice. The desktop element is the surface the wallpaper menu belongs
   * to; the document is the backstop, so a press that no surface has claimed
   * still gets a menu instead of the browser's. Handlers that answer a press
   * stop it there, so a window or a taskbar chip still wins over this.
   */
  private bindMenu() {
    bindContextMenu(this.element, () => this.menuItems());
    this.unbindFallback = bindContextMenu(document, () => this.menuItems());
  }

  /** What the wallpaper offers. Built at the moment of the press. */
  private menuItems(): MenuItem[] {
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
         * Opened out of the item that was pressed, and both the change and
         * the write live inside the callback — it runs after the old picture
         * has been taken, so anything reading `appearance.get()` outside it
         * would be reading the theme this is replacing.
         */
        toggleTheme: (event) => {
          const next = appearance.scheme() === "dark" ? "light" : "dark";
          swapAppearance(() => {
            appearance.set({ theme: next });
            // `appearance.set` only repaints; persisting is the caller's job,
            // as it is in the Settings window. Without this the theme would
            // go back on the next reload, which is not what flipping a switch
            // means.
            void saveSettings(appearance.get());
          }, centreOf(event.currentTarget as Element));
        },
        showAll: () => void this.taskbar.showOverview(this.mainElement),
        minimizeAll: () =>
          onScreen.forEach((open) => void open.window.minimize()),
        settings: () => void new SettingsApp(this).load()
      }
    );
  }

  /**
   * The desktop's own verbs, for anything that offers them.
   *
   * The wallpaper menu builds these against the item that was pressed, so the
   * theme swap can open out of it. The launcher has no such item — it is a
   * panel in the middle of the screen — so its swap opens from the centre.
   */
  private launcherActions() {
    return {
      toggleTheme: () => {
        const next = appearance.scheme() === "dark" ? "light" : "dark";
        swapAppearance(() => {
          appearance.set({ theme: next });
          void saveSettings(appearance.get());
        });
      },
      showAll: () => void this.taskbar.showOverview(this.mainElement),
      minimizeAll: () =>
        windowManager
          .list()
          .filter((open) => !open.minimized)
          .forEach((open) => void open.window.minimize()),
      settings: () => void new SettingsApp(this).load(),
      openProjects: (repo?: Repo) => {
        windowManager.new({
          title: "Projects",
          meta: "github",
          content: new ProjectsContent(repo),
          desktop: this,
          dimensions: { width: 760, height: 620 }
        });
      }
    };
  }

  async load(element: HTMLElement) {
    await super.load(element);
  }

  async beforeUnload() {
    this.unbindFallback?.();
    this.unbindFallback = undefined;
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
    /*
     * Beside the desktop for the same reason as the menu and the selection
     * layer: this is a fixed panel, and the desktop clips its overflow and is
     * the element the overview scales.
     */
    this.launcher = new Launcher(this, this.launcherActions());
    await this.launcher.load(this.mainElement);
    await this.applyStyle();
    // Let the boot sequence finish before it fades; the desktop is already
    // built behind it, so this costs nothing but the animation.
    await bootscreen.complete?.();
    await bootscreen.unload();
  }
}

export default Desktop;
