import OSElement from "../../utils/OSElement";
import Bootlogo from "./bootlogo";
import { color, font, size } from "../../theme";

/**
 * How long the boot sequence is on screen.
 *
 * This used to be incidental: startup awaited two canvas stack blurs of the
 * wallpaper, so the screen happened to sit there for over a second. With that
 * work gone the sequence flashed past, so the duration is now stated outright —
 * it is an intro, not a wait for anything.
 */
const BOOT_MS = 1100;

class Bootscreen extends OSElement {
  canvas!: SVGSVGElement;
  path!: SVGPathElement;
  bootlogo: Bootlogo;
  private bar!: HTMLElement;
  private fill!: HTMLElement;
  private label!: HTMLElement;
  constructor() {
    super("Bootscreen", "bootscreen");
    this.style = () => ({
      [this.id]: {
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: "9999",
        overflow: "hidden",
        opacity: "1",
        transition: "250ms opacity linear",
        background:
          "var(--wallpaper-sky)",
        display: "flex",
        flexFlow: "column",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        gap: "22px",
        fontFamily: font.ui,
        "& > .boot-bar": {
          width: "168px",
          height: "3px",
          borderRadius: "2px",
          background: color.line,
          overflow: "hidden"
        },
        "& > .boot-bar > i": {
          display: "block",
          width: "6%",
          height: "100%",
          borderRadius: "2px",
          background: color.accent,
          transition: `width ${BOOT_MS}ms cubic-bezier(.25,.8,.35,1)`
        },
        "& > .boot-label": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: color.inkFaint
        },
        "&::before": {
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
    });
    this.bootlogo = new Bootlogo();

    this.bar = document.createElement("div");
    this.bar.className = "boot-bar";
    this.fill = document.createElement("i");
    this.bar.appendChild(this.fill);

    this.label = document.createElement("span");
    this.label.className = "boot-label";
    this.label.appendChild(document.createTextNode("Starting up"));
  }

  async beforeLoad() {
    await this.bootlogo.load(this.element);
    this.element.appendChild(this.bar);
    this.element.appendChild(this.label);
  }

  /**
   * Run the bar to full, then resolve. Determinate rather than a spinner: boot
   * knows how long it intends to take, so it should say so.
   */
  complete(): Promise<void> {
    return new Promise((resolve) => {
      // Next frame, so the transition has a starting value to animate from.
      requestAnimationFrame(() => {
        this.fill.style.width = "100%";
      });
      setTimeout(resolve, BOOT_MS);
    });
  }
  
  
  async beforeUnload(): Promise<void> {
    const promise = new Promise((resolve): void => {
      this.element.style.opacity = "0";
      setTimeout(() => {
        resolve(null);
      }, 250);
    });
    await promise
  }
}

export default Bootscreen;
