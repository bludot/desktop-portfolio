import OSElement from "./../../utils/OSElement";
import TaskbarButtons from "./button";
import WindowBlur from "../Window/blur";
import StartMenu from "../StartMenu";

class Taskbar extends OSElement {
  taskbarButtons: TaskbarButtons;
  constructor() {
    super("taskbar", "taskbar");
    const blur = new WindowBlur(30, 8);
    blur.load(this.element);
    this.taskbarButtons = new TaskbarButtons();
    this.taskbarButtons.load(this.element);
    this.style = () => ({
      [this.id]: {
        height: "50px",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "block",
        zIndex: "1000",
        backgroundColor: "rgba(255,255,255,.5)",
        margin: "15px",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: `0 17px 50px 0 rgba(0, 0, 0, 0.19),
        0 12px 15px 0 rgba(0, 0, 0, 0.24)`,
        // "backdrop-filter": "blur(20px)",
        /*...(!support.css.backdropFilter && {
          backgroundColor: "rgba(200,200,200,.8)"
        }),*/
        color: "#000"
      }
    });
  }

  async load(element) {
    super.load(element);
  }
}

export default Taskbar;
