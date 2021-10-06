import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faTimes,
  faWindowMaximize,
  faWindowMinimize
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

jss.setup(preset());
jss.use(nested());

let count = 2;

async function startup() {
  await settings.setDesktopImage("https://i.imgur.com/DELma5R.jpg");
}
startup().then(() => {
  const desktop = new Desktop({
    backgroundColor: "#4FC3F7",
    mainElement: document.querySelector("#app")
  });
  bridge.set<Desktop>("Desktop", desktop);

  desktop.startup();
  /*
  const initWindow = new LocalWindow({
    title: `window ${count}`,
    content,
    desktop
  });
  initWindow.load(document.querySelector("desktop"));
  */
  // document.body.appendChild(LocalWindow({ title: "window 1", content }));
  // document.body.appendChild(LocalWindow({ title: "window 2", content }));

  // We are only using the user-astronaut icon
  library.add(faTimes, faWindowMaximize, faWindowMinimize);

  // Replace any existing <i> tags with <svg> and set up a MutationObserver to
  // continue doing this as the DOM changes.
  dom.watch();

  const list = new DoublyLinkedList<any>();

  list.push("test");
  list.push("test2");

  list.printList();

  console.log(list.head);
});
