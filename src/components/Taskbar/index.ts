import OSElement from "./../../utils/OSElement";
import type Desktop from "../Desktop";
import TaskbarButtons from "./button";
import { isNarrow } from "../../utils/utils";
import { blur as blurFx, color, radius, shadow } from "../../theme";

class Taskbar extends OSElement {
  taskbarButtons: TaskbarButtons;
  isMobile: boolean

  constructor(desktop: Desktop) {
    super("taskbar", "taskbar");
    this.isMobile = isNarrow()
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
        backgroundColor: color.chromeSolid,
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

  /** The window overview, for anything that wants it without owning it. */
  showOverview(host: HTMLElement) {
    return this.taskbarButtons.showOverview(host);
  }

  async load(element: HTMLElement) {
    await super.load(element);
  }
}

export default Taskbar;
