import OSElement from "../../utils/OSElement";
import Bootlogo from "./bootlogo";
import { color, font, motion, size } from "../../theme";
import { prefersReducedMotion } from "../../utils/motion";
import { GlobalLogger } from "../../Logger";
import type { Log } from "../../Logger/Log";
import { LOG_TYPE } from "../../Logger/interfaces";

/**
 * The least time the boot sequence is on screen, measured from the moment the
 * screen is built rather than from the moment it is asked to finish.
 *
 * A floor, not a duration. Start-up is usually quicker than this and the screen
 * would flash past — it is an intro, and an intro nobody can see is not one —
 * but a slow start is left alone: the sequence has already had its time by
 * then, so it gets out of the way rather than adding to the wait.
 */
const MIN_BOOT_MS = 1100;

/** The fade at the end, and the window the sky has to come back into focus. */
const FADE_MS = 250;

/** How far out of focus the desktop sits while the sequence runs. */
const BOOT_BLUR_PX = 26;

/** Lines kept on screen. Older ones are dropped rather than left to grow. */
const LOG_LINES = 60;

/**
 * The lifecycle chatter every `OSElement` emits.
 *
 * Each component says six or seven of these on its way up, which buries the
 * handful of lines that say what start-up is actually doing under a wall of
 * "Finished afterLoad hook". One line per component — "Loaded Instance" — is
 * the part worth watching, so the rest is dropped.
 *
 * Only ever applied to debug lines: a warning or an error is never hidden,
 * whatever it says.
 */
const LIFECYCLE_NOISE =
  /^(Initializing|Loading Instance|Unloaded Instance|Applying styles|Applyied styles|Unloading styles|Unloaded styles|(Finished )?\w+ hook)$/;

export interface BootscreenOptions {
  /**
   * Show what start-up is actually doing, line by line, under the label.
   * Off unless asked for by `?bootlog=1` — see `src/index.ts`.
   */
  log?: boolean;
}

class Bootscreen extends OSElement {
  canvas!: SVGSVGElement;
  path!: SVGPathElement;
  bootlogo: Bootlogo;
  private bar!: HTMLElement;
  private fill!: HTMLElement;
  private label!: HTMLElement;
  private showLog: boolean;
  private log?: HTMLElement;
  private subscription?: { unsubscribe: () => void };
  /** The first line's clock, so the times read as "since boot". */
  private origin: number | null = null;
  /** When the screen went up, which is what the floor is measured against. */
  private readonly startedAt = Date.now();
  constructor({ log = false }: BootscreenOptions = {}) {
    super("Bootscreen", "bootscreen");
    this.showLog = log;
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
        /*
         * The desktop is built behind this screen, so it can be shown through
         * it out of focus rather than hidden behind a flat colour. The blur is
         * a backdrop filter rather than a filter on the desktop itself: it
         * belongs to the screen that is asking for it and leaves with it, and
         * filtering the desktop would make it the containing block for every
         * window mounted inside it.
         */
        /*
         * Blur alone is not enough to read against.
         *
         * A blurred photograph keeps all of its contrast — it only stops being
         * a picture of something — so pale text over a bright patch of it is
         * still pale text over a bright patch. The glass token is the theme's
         * answer to exactly this, and the one windows use over their own blur:
         * translucent, and light or dark to match the scheme, so it pushes the
         * whole backdrop towards whichever end the text is not at.
         */
        backgroundColor: color.glass,
        backdropFilter: `blur(${BOOT_BLUR_PX}px) saturate(1.06)`,
        WebkitBackdropFilter: `blur(${BOOT_BLUR_PX}px) saturate(1.06)`,
        transition: [
          `opacity ${FADE_MS}ms linear`,
          `backdrop-filter ${FADE_MS}ms ${motion.standard}`,
          `-webkit-backdrop-filter ${FADE_MS}ms ${motion.standard}`
        ].join(", "),
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
          // Overwritten with whatever is left of the floor when the bar runs.
          transition: `width ${MIN_BOOT_MS}ms cubic-bezier(.25,.8,.35,1)`
        },
        "& > .boot-label": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: color.inkFaint
        },
        "& > .boot-log": {
          width: "min(620px, 84vw)",
          maxHeight: "34vh",
          overflow: "hidden",
          display: "flex",
          flexFlow: "column",
          alignSelf: "center",
          textAlign: "left",
          fontFamily: font.mono,
          fontSize: size.micro,
          lineHeight: 1.6,
          color: color.inkSoft
        },
        "& > .boot-log > span": {
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        },
        // The clock and the component name, held back so the message carries.
        "& > .boot-log .boot-log-meta": {
          fontStyle: "normal",
          color: color.inkFaint
        },
        // Two levels, not four: a boot log only needs to say "this is the
        // ordinary run of things" and "look at this one".
        "& > .boot-log > span.is-loud": {
          color: color.current
        },
        /*
         * The flat sky, sitting over the blurred desktop until there is a
         * desktop worth showing. Behind the logo rather than over it: an
         * absolutely positioned pseudo-element would otherwise paint above the
         * static children it is meant to sit under.
         */
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: -1,
          background: "var(--wallpaper-sky)",
          transition: `opacity ${motion.sweep}ms ${motion.standard}`
        },
        "&.boot-revealed::before": {
          opacity: 0
        }
      }
    });
    this.bootlogo = new Bootlogo();

    this.bar = document.createElement("div");
    this.bar.className = "boot-bar";
    this.fill = document.createElement("i");
    this.bar.appendChild(this.fill);

    this.label = document.createElement("span");
    this.label.className = "boot-label";
    this.label.appendChild(document.createTextNode("Starting up"));

    if (this.showLog) {
      this.log = document.createElement("div");
      this.log.className = "boot-log";
      this.log.setAttribute("aria-hidden", "true");
    }
  }

  async beforeLoad() {
    await this.bootlogo.load(this.element);
    this.element.appendChild(this.bar);
    this.element.appendChild(this.label);
    if (this.log) {
      this.element.appendChild(this.log);
      this.watchLog();
    }
  }

  /**
   * Follow the log, from the beginning.
   *
   * The replay matters: the first components announce themselves while this
   * screen is still being built, so a subscription on its own would start the
   * story a few lines in.
   */
  private watchLog() {
    const global = GlobalLogger.getInstance();
    global.getLogs().forEach((entry) => this.appendLine(entry));
    this.subscription = global.subscribe("log", (entry: Log) =>
      this.appendLine(entry)
    );
  }

  private appendLine(entry: Log) {
    if (!this.log) return;
    const quiet =
      entry.type === LOG_TYPE.DEBUG || entry.type === LOG_TYPE.TRACE;
    if (quiet && LIFECYCLE_NOISE.test(String(entry.message))) return;

    const at = entry.timestamp?.getTime?.() ?? 0;
    if (this.origin === null) this.origin = at;

    const line = document.createElement("span");
    const loud =
      entry.type === LOG_TYPE.ERROR || entry.type === LOG_TYPE.WARNING;
    if (loud) line.className = "is-loud";

    /*
     * The message is the part being read; the clock and the component are how
     * you find it again. Split so the two can be weighted differently — one
     * flat colour for the whole line means either the message is too faint or
     * the timestamps shout.
     */
    const since = `${Math.max(0, at - this.origin)}`.padStart(4, " ");
    const meta = document.createElement("i");
    meta.className = "boot-log-meta";
    meta.appendChild(
      document.createTextNode(`${since}ms  ${entry.serviceName ?? "-"}  `)
    );
    line.appendChild(meta);
    line.appendChild(document.createTextNode(String(entry.message)));

    this.log.appendChild(line);

    while (this.log.childElementCount > LOG_LINES) {
      this.log.removeChild(this.log.firstElementChild as Element);
    }
  }

  /**
   * Fade the flat sky out, leaving the desktop showing through out of focus.
   *
   * Nothing happens under reduced motion: the point of the reveal is the
   * change itself, and a sky that is already the right colour loses nothing by
   * staying put.
   */
  reveal() {
    if (prefersReducedMotion()) return;
    this.element.classList.add("boot-revealed");
  }

  /**
   * Run the bar out to whatever is left of the floor, then resolve.
   *
   * Determinate rather than a spinner, and the bar is given the time that is
   * actually left rather than the whole floor: by the time this is called the
   * desktop is built, so the only thing still to happen is the wait, and a bar
   * that says so is telling the truth. A start-up that has already outrun the
   * floor gets no wait at all.
   */
  complete(): Promise<void> {
    const remaining = Math.max(0, MIN_BOOT_MS - (Date.now() - this.startedAt));
    return new Promise((resolve) => {
      this.reveal();
      // Next frame, so the transition has a starting value to animate from.
      requestAnimationFrame(() => {
        this.fill.style.transitionDuration = `${remaining}ms`;
        this.fill.style.width = "100%";
      });
      setTimeout(resolve, remaining);
    });
  }

  async beforeUnload(): Promise<void> {
    this.subscription?.unsubscribe();
    this.subscription = undefined;

    const promise = new Promise((resolve): void => {
      this.element.style.opacity = "0";
      // Back into focus on the way out, over the same window as the fade: the
      // desktop is what is being handed over to, so it should be the thing
      // that sharpens rather than something revealed already sharp.
      this.element.style.backdropFilter = "blur(0px)";
      (this.element.style as Record<string, any>).webkitBackdropFilter =
        "blur(0px)";
      setTimeout(() => {
        resolve(null);
      }, FADE_MS);
    });
    await promise;
  }
}

export default Bootscreen;
