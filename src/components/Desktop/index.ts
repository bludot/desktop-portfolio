import Logger from "../../Logger";
import OSElement from "../../utils/OSElement";
import Taskbar from "./../Taskbar";

const logger = new Logger("Desktop");

/**
 * The sky, drawn rather than photographed.
 *
 * The previous wallpaper was a JPEG whose detail competed with every window
 * placed on it, and it had to be stack-blurred on a canvas twice at boot so the
 * window-blur fallback had something to sample. Three soft bands over a
 * gradient keep the same pastel character, never fight the content, cost
 * nothing to load, and scale to any viewport.
 */
const RIDGES = [
  {
    height: "42%",
    background: "rgba(158, 142, 184, .22)",
    borderRadius: "46% 54% 0 0 / 74% 68% 0 0",
    transform: "none"
  },
  {
    height: "30%",
    background: "rgba(136, 118, 166, .24)",
    borderRadius: "62% 38% 0 0 / 82% 62% 0 0",
    transform: "translateX(-14%) scaleX(1.5)"
  },
  {
    height: "19%",
    background: "rgba(116, 100, 144, .26)",
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
        background:
          "linear-gradient(180deg, #f7c6d2 0%, #f9d5cd 26%, #fae3d4 44%, #f2ddda 58%, #e6dced 100%)",
        zIndex: "1",
        overflow: "hidden",
        "& > .desktop-sun": {
          position: "absolute",
          top: "12%",
          right: "18%",
          width: "190px",
          height: "190px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,244,232,.85), rgba(255,228,214,0) 68%)",
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
              background: ridge.background,
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

  async startup(bootscreen: { unload: () => Promise<void> }) {
    logger.debug("Starting desktop");
    this.mainElement.appendChild(this.element);
    this.taskbar.load(this.element);
    await this.applyStyle();
    await bootscreen.unload();
  }
}

export default Desktop;
