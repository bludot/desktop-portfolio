import OSElement from "../../utils/OSElement";
import settings from "../../utils/settings";
import Loader from "../Loader";

class Bootscreen extends OSElement {
  loader: Loader;
  constructor() {
    super("Bootscreen", "bootscreen");
    this.style = () => ({
      [this.id]: {
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundImage: `url(${settings.getDesktopImage().original})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: "9999",
        overflow: "hidden",
        opacity: "1",
        transition: "250ms opacity linear",
      },
    });
    this.loader = new Loader();
  }
  beforeLoad() {
    this.loader.load(this.element)
    return Promise.resolve();
  }
  beforeUnload() {
    return new Promise((resolve) => {
      this.element.style.opacity = "0"
      setTimeout(() => resolve, 250)
    })
  }
}

export default Bootscreen;
