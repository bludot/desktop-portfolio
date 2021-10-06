import OSElement from "../../utils/OSElement";
import settings from "../../utils/settings";

class Bootscreen extends OSElement {
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
        overflow: "hidden"
      }
    });
  }
}

export default Bootscreen;