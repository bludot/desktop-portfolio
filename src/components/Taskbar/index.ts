import OSElement from "./../../utils/OSElement";
import type Desktop from "../Desktop";
import TaskbarButtons from "./button";
import WindowBlur from "../Window/blur";
import { isNarrow } from "../../utils/utils";
// Aliased: the constructor already has a WindowBlur named blur.
import { blur as blurFx, color, radius, shadow } from "../../theme";

class Taskbar extends OSElement {
  taskbarButtons: TaskbarButtons;
  isMobile: boolean

  constructor(desktop: Desktop) {
    super("taskbar", "taskbar");
    this.isMobile = isNarrow()
    const blur = new WindowBlur(30, 8);
    blur.load(this.element);
    this.taskbarButtons = new TaskbarButtons(desktop);
    this.taskbarButtons.load(this.element);
    this.style = () => ({
      [this.id]: {
        height: "50px",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        zIndex: "1000",
        backgroundColor: color.chrome,
        backdropFilter: blurFx.chrome,
        WebkitBackdropFilter: blurFx.chrome,
        margin: this.isMobile ? "0px" : "15px",
        ...(this.isMobile ? {} : { borderRadius: radius.window }),
        overflow: "hidden",
        boxShadow: `${shadow.chrome}, ${shadow.edge}`,
        color: color.ink
      }
    });
  }

  async load(element: HTMLElement) {
    await super.load(element);
  }
}

export default Taskbar;
