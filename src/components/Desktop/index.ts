import OSElement from "../../utils/OSElement";
import settings from "../../utils/settings";
import Taskbar from "./../Taskbar";

class Desktop extends OSElement {
  mainElement: HTMLElement;
  element: HTMLElement;
  id: string;
  backgroundColor: string;
  taskbar: Taskbar;
  constructor({
    backgroundColor = "#4FC3F7",
    mainElement = document.body
  }: {
    backgroundColor: string;
    mainElement: HTMLElement;
  }) {
    super("desktop", "desktop");
    this.mainElement = mainElement;
    this.backgroundColor = backgroundColor;
    this.taskbar = new Taskbar();
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
        zIndex: "1",
        overflow: "hidden"
      }
    });
  }
  getTaskbar() {
    return this.taskbar;
  }

  async load(element: HTMLElement) {
    super.load(element);
  }
  async startup(bootscreen) {
    this.mainElement.appendChild(this.element);
    this.taskbar.load(this.element);
    await this.applyStyle();
    setTimeout(() => {bootscreen.unload()}, 5000)
  }
}

export default Desktop;
