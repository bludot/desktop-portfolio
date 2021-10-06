import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faTimes,
  faWindowMaximize,
  faWindowMinimize,
} from "@fortawesome/free-solid-svg-icons";
// import LocalWindow from "./components/Window";
import Desktop from "./components/Desktop";
import Button from "./components/Button";
import { DoublyLinkedList } from "./utils/linkedList";
import windowManager from "./utils/windowManager";
import jss from "jss";
import preset from "jss-preset-default";
import nested from "jss-plugin-nested";
import settings from "./utils/settings";
import bridge from "./utils/bridge";
import { backgroundImage } from "html2canvas/dist/types/css/property-descriptors/background-image";
import Bootscreen from "./components/Bootscreen";
import queryString from "query-string";

jss.setup(preset());
jss.use(nested());

let count = 2;
const bootscreen = new Bootscreen();
bootscreen.load(document.querySelector("#app"));

async function startup() {
  await settings.setDesktopImage("/assets/main_desktop_background.jpg");
}
startup().then(() => {
  console.log('after set')
  const desktop = new Desktop({
    backgroundColor: "#4FC3F7",
    mainElement: document.querySelector("#app"),
  });
  bridge.set<Desktop>("Desktop", desktop);
  const params = queryString.parse(location.search);
  
  if (params.bootscreen === "1") {
  } else {
    desktop.startup(bootscreen);
  }

  // We are only using the user-astronaut icon
  library.add(faTimes, faWindowMaximize, faWindowMinimize);

  // Replace any existing <i> tags with <svg> and set up a MutationObserver to
  // continue doing this as the DOM changes.
  dom.watch();

});
