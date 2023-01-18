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
import settings from "./utils/settings";
import bridge from "./utils/bridge";
import Bootscreen from "./components/Bootscreen";
import queryString from "query-string";
import Logger, {GlobalLogger} from "./Logger";
import windowManager from "./utils/windowManager";
import LoggerWindow from "./contents/logger";
import ExperienceContent from "./contents/experience";
import AboutContent from "./contents/about";
import AlertContent from "./contents/alert";
import KeyCatcher from "./apps/KeyCatcher";
import {FeatureFlag} from "./Store";


// @ts-ignore
window.LOGGER = GlobalLogger.getInstance();
jss.setup(preset());
jss.use(nested());

let count = 2;
const bootscreen = new Bootscreen();
bootscreen.load(document.querySelector("#app"));

const logger = new Logger("Bootsequence");
logger.info("Starting up...");

async function startup() {
  logger.debug(`setting Dekstop Image: ${settings.desktopImage.original}`);
  await settings.setDesktopImage("/assets/main_desktop_background.jpg");
  logger.debug(`Dekstop Image Set:  ${settings.desktopImage.original}`);
}

const mainWindows = {
  "experience": ({top, left}: { top?: number, left?: number }) => {
    windowManager.new({
      title: `Experience`,
      content: new ExperienceContent(),
      desktop: bridge.get<Desktop>("Desktop"),
      dimensions: {
        width: 600,
        height: 500,
      },
      windowPosition: top || left ? {
        top,
        left,
      } : {},
      center: top || left ? false : true
    });
  },
  "about": ({top, left}: { top?: number, left?: number }) => {
    windowManager.new({
      title: `About`,
      content: new AboutContent(),
      desktop: bridge.get<Desktop>("Desktop"),
      windowPosition: top || left ? {
        top,
        left,
      } : {},
      center: top || left ? false : true
    });
  },
  "alert": () => {
    windowManager.new({
      title: `Unexpected Error`,
      content: new AlertContent({title: "Unexpected Error", text: "Unable to do this action"}),
      dimensions: {
        width: 250,
        height: 150
      },
      desktop: bridge.get<Desktop>("Desktop"),
      isDialog: true
    });
  }
}

startup().then(async () => {
  const desktop = new Desktop({
    backgroundColor: "#EEEEEE",
    mainElement: document.querySelector("#app"),
  });
  bridge.set<Desktop>("Desktop", desktop);
  const params = queryString.parse(location.search);

  if (params.bootscreen === "1") {
  } else {
    await desktop.startup(bootscreen);
  }
  if (params.debug === "1") {
    windowManager.new({
      title: "Debugger",
      content: new LoggerWindow(),
      dimensions: {width: 800, height: 400},
      desktop: bridge.get<Desktop>("Desktop"),
    });
  }
  if (params.windows) {

    const windows = (params.windows as string).split(',')
    windows.forEach(windowToOpen => {
      if (windows.includes("experience") && windows.includes("about")) {
        if (windowToOpen == "about") {
          mainWindows[windowToOpen]({top: 30, left: 30})
          return
        }
        if (windowToOpen == "experience") {
          mainWindows[windowToOpen]({top: 30, left: 600})
          return

        }
        if (mainWindows[windowToOpen]) {
          mainWindows[windowToOpen]({})
        }

        return
      }
      if (mainWindows[windowToOpen]) {
        mainWindows[windowToOpen]({})
      }
    })
  }
  mainWindows["about"]({top: 30, left: 30})
  mainWindows["experience"]({top: 30, left: 600})

  const keyCatcher: KeyCatcher = new KeyCatcher();
  keyCatcher.startListener()
  keyCatcher.addSequence('debug', () => {
    windowManager.new({
      title: "Debugger",
      content: new LoggerWindow(),
      dimensions: {width: 800, height: 400},
      desktop: bridge.get<Desktop>("Desktop"),
    });
  })
  // We are only using the user-astronaut icon
  library.add(faTimes, faWindowMaximize, faWindowMinimize);

  // Replace any existing <i> tags with <svg> and set up a MutationObserver to
  // continue doing this as the DOM changes.
  dom.watch();
});
