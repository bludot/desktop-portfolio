import {library, dom} from "@fortawesome/fontawesome-svg-core";
import {
  faTimes,
  faWindowMaximize,
  faWindowMinimize,
} from "@fortawesome/free-solid-svg-icons";
import Desktop from "./components/Desktop";
import jss from "jss";
import preset from "jss-preset-default";
import nested from "jss-plugin-nested";
import Bootscreen from "./components/Bootscreen";
import queryString from "query-string";
import Logger, {GlobalLogger} from "./Logger";
import windowManager from "./utils/windowManager";
import appearance from "./utils/appearance";
import { attachGlobalStyles } from "./theme";
import { loadSettings } from "./Store";
import LoggerWindow from "./contents/logger";
import ExperienceContent from "./contents/experience";
import AboutContent from "./contents/about";
import ProjectsContent from "./contents/projects";
import AlertContent from "./contents/alert";
import KeyCatcher from "./apps/KeyCatcher";
import {FeatureFlag} from "./Store";


// @ts-ignore
window.LOGGER = GlobalLogger.getInstance();
jss.setup(preset());
jss.use(nested());

let count = 2;

/*
 * Read before anything is built, because the boot screen is the first thing on
 * screen and one of these decides what it looks like.
 */
const params = queryString.parse(location.search);

/*
 * `?bootlog=1` prints the log under the boot label — what start-up is actually
 * doing, in the order it does it, on the screen that is up while it happens.
 * `?debug=1` implies it, since that is already the switch for "show me the
 * inside"; it also opens the Debugger window, which has the whole log rather
 * than the first few seconds of it.
 */
const bootscreen = new Bootscreen({
  log: params.bootlog === "1" || params.debug === "1"
});
bootscreen.load(document.querySelector("#app") as HTMLElement);

const logger = new Logger("Bootsequence");
logger.info("Starting up...");

async function startup() {
  // The desktop draws its own sky, so there is nothing to fetch or blur here.
  logger.debug("Preparing desktop");

  /*
   * Appearance first, and before anything paints. The tokens are applied to the
   * root element, so a desktop built before this runs would flash the default
   * light theme for a frame and then swap — the classic wrong-theme flicker.
   *
   * A failed read is not fatal: the defaults are already in force, and losing a
   * wallpaper preference is a much smaller problem than failing to boot.
   */
  attachGlobalStyles();
  appearance.apply();
  logger.debug("Theme applied");
  try {
    const saved = await loadSettings();
    const keys = Object.keys(saved);
    if (keys.length) appearance.hydrate(saved);
    logger.debug(
      keys.length
        ? `Restored settings: ${keys.join(", ")}`
        : "No saved settings; using defaults"
    );
  } catch (error) {
    logger.warn(`Could not read saved settings: ${error}`);
  }
}

/**
 * How big each of these wants to be, given the room.
 *
 * Stated here rather than inside each opener because the opening layout has to
 * do arithmetic with them: three windows can only be laid out side by side by
 * something that knows how wide all three are before any of them exists.
 */
const WINDOW_SIZES: Record<string, { width: number; height: number }> = {
  projects: {width: 760, height: 620},
  experience: {width: 588, height: 470},
  about: {width: 330, height: 430},
}

interface Placement { top?: number; left?: number; width?: number; height?: number }

// Built once the desktop exists, so each opener can be handed it directly
// rather than reaching for a global.
const makeMainWindows = (desktop: Desktop) => ({
  "experience": ({top, left, width, height}: Placement) => {
    windowManager.new({
      title: `Experience`,
      meta: `8 roles \u00b7 2012-2026`,
      content: new ExperienceContent(),
      desktop: desktop,
      dimensions: {
        width: width ?? WINDOW_SIZES.experience.width,
        height: height ?? WINDOW_SIZES.experience.height,
      },
      windowPosition: top || left ? {
        top,
        left,
      } : {},
      center: top || left ? false : true
    });
  },
  "about": ({top, left, width, height}: Placement) => {
    windowManager.new({
      title: `About`,
      content: new AboutContent(),
      desktop: desktop,
      dimensions: {
        width: width ?? WINDOW_SIZES.about.width,
        height: height ?? WINDOW_SIZES.about.height,
      },
      windowPosition: top || left ? {
        top,
        left,
      } : {},
      center: top || left ? false : true
    });
  },
  "projects": ({top, left, width, height}: Placement) => {
    windowManager.new({
      title: `Projects`,
      meta: `github`,
      content: new ProjectsContent(),
      desktop: desktop,
      dimensions: {
        width: width ?? WINDOW_SIZES.projects.width,
        height: height ?? WINDOW_SIZES.projects.height,
      },
      windowPosition: top || left ? {
        top,
        left,
      } : {},
      center: top || left ? false : true
    });
  },
  "alert": () => {
    windowManager.new({
      title: `Couldn't open that`,
      content: new AlertContent({title: "That window isn't ready yet", text: "It's the next thing being built. Everything else on the desktop works."}),
      dimensions: {
        width: 250,
        height: 150
      },
      desktop: desktop,
      isDialog: true
    });
  }
})

startup().then(async () => {
  const desktop = new Desktop({
    backgroundColor: "#EEEEEE",
    mainElement: document.querySelector("#app") as HTMLElement,
  });
  const mainWindows = makeMainWindows(desktop);

  if (params.bootscreen === "1") {
    /*
     * Hold the boot screen up, over the real desktop.
     *
     * It used to hold it up over nothing at all — the desktop was never
     * started — which made the one thing the flag is for impossible to see:
     * the boot screen is mostly a blur and a tint of whatever is behind it,
     * and there is nothing to judge either against on an empty page. Building
     * the desktop and simply never dismissing the screen shows what a viewer
     * actually gets, held still.
     */
    await desktop.startup({
      complete: () => bootscreen.complete(),
      unload: async () => {}
    });
  } else {
    await desktop.startup(bootscreen);
  }
  if (params.debug === "1") {
    windowManager.new({
      title: "Debugger",
      content: new LoggerWindow(),
      dimensions: {width: 800, height: 400},
      desktop: desktop,
    });
  }
  /*
   * Lay the opening windows out in a row, none of them covering another.
   *
   * Worked out from the viewport rather than written down as coordinates: three
   * windows at their natural sizes want about 1800px, which almost no laptop
   * has, so a fixed table would either overlap them or hang them off the right
   * edge. Instead the row is scaled to whatever room there is — every window
   * stays wholly visible, and each keeps its share of the width, so the one
   * with the most in it is still the widest.
   *
   * Below MIN_TILE_PX there is no honest way to show three windows at once, so
   * nothing is placed and each opens centred — which is also what a phone gets,
   * where they stack and the last one opened is the one being read.
   */
  const EDGE = 24
  const GAP = 24
  /** Room the taskbar takes, plus a breath under the windows. */
  const FLOOR = 88
  const MIN_TILE_PX = 900

  const rowLayout = (names: string[]): Record<string, Placement> => {
    const placed = names.filter((name) => WINDOW_SIZES[name])
    if (placed.length < 2 || window.innerWidth < MIN_TILE_PX) return {}

    const room = window.innerWidth - EDGE * 2 - GAP * (placed.length - 1)
    const wanted = placed.reduce((sum, name) => sum + WINDOW_SIZES[name].width, 0)
    const scale = Math.min(1, room / wanted)
    const ceiling = window.innerHeight - FLOOR - EDGE

    const layout: Record<string, Placement> = {}
    let left = EDGE + Math.max(0, (room - wanted * scale) / 2)
    placed.forEach((name) => {
      const width = Math.round(WINDOW_SIZES[name].width * scale)
      layout[name] = {
        top: EDGE,
        left: Math.round(left),
        width,
        height: Math.min(WINDOW_SIZES[name].height, ceiling),
      }
      left += width + GAP
    })
    return layout
  }

  const openWindows = (names: string[]) => {
    logger.debug(`Opening windows: ${names.join(", ")}`)
    const layout = rowLayout(names)
    names.forEach(name => {
      if (!Object.prototype.hasOwnProperty.call(mainWindows, name)) return
      const open = mainWindows[name as keyof typeof mainWindows]
      open(layout[name] || {})
    })
  }

  if (params.windows) {
    // Repeating the param (?windows=a&windows=b) yields an array, not a string.
    const requested = Array.isArray(params.windows)
      ? params.windows.join(',')
      : params.windows as string
    openWindows(requested.split(','))
  } else {
    /*
     * Last one opened is the one in front, so About is opened last: it is the
     * page that says who this is, and it should be what someone is looking at
     * when the desktop settles — especially on a phone, where the windows stack
     * and only the top one is really on screen.
     */
    openWindows(["projects", "experience", "about"])
  }

  const keyCatcher: KeyCatcher = new KeyCatcher(desktop);
  keyCatcher.startListener()
  keyCatcher.addSequence('debug', () => {
    windowManager.new({
      title: "Debugger",
      content: new LoggerWindow(),
      dimensions: {width: 800, height: 400},
      desktop: desktop,
    });
  })
  // We are only using the user-astronaut icon
  library.add(faTimes, faWindowMaximize, faWindowMinimize);

  // Replace any existing <i> tags with <svg> and set up a MutationObserver to
  // continue doing this as the DOM changes.
  dom.watch();
});
