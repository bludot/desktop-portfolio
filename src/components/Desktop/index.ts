import Logger from "../../Logger";
import OSElement from "../../utils/OSElement";
import Taskbar from "./../Taskbar";

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

  async load(element: HTMLElement) {
    super.load(element);
  }

  async startup(bootscreen: {
    unload: () => Promise<void>;
    complete?: () => Promise<void>;
  }) {
    logger.debug("Starting desktop");
    this.mainElement.appendChild(this.element);
    this.taskbar.load(this.element);
    await this.applyStyle();
    // Let the boot sequence finish before it fades; the desktop is already
    // built behind it, so this costs nothing but the animation.
    await bootscreen.complete?.();
    await bootscreen.unload();
  }
}

export default Desktop;
