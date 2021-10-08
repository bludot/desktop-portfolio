import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faTimes,
  faWindowMaximize,
  faWindowMinimize,
} from "@fortawesome/free-solid-svg-icons";
// import LocalWindow from "./components/Window";
import Desktop from "./components/Desktop";
import jss from "jss";
import preset from "jss-preset-default";
import nested from "jss-plugin-nested";
import settings from "./utils/settings";
import bridge from "./utils/bridge";
import Bootscreen from "./components/Bootscreen";
import queryString from "query-string";
import Logger, { GlobalLogger } from "./Logger";
import windowManager from "./utils/windowManager";
import LoggerWindow from "./contents/logger";

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
      dimensions: { width: 800, height: 400 },
      desktop: bridge.get<Desktop>("Desktop"),
    });
  }

  
  // We are only using the user-astronaut icon
  library.add(faTimes, faWindowMaximize, faWindowMinimize);

  // Replace any existing <i> tags with <svg> and set up a MutationObserver to
  // continue doing this as the DOM changes.
  dom.watch();
});
