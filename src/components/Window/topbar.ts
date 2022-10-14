import OSElement from "../../utils/OSElement";
import TitleBar from "./titlebar";
import WindowButtons from "./buttons";

class TopBar extends OSElement {
  titlebar: TitleBar;
  windowButtons: WindowButtons;
  constructor({ title, close, isDialog }) {
    super("topbar", "topbar");
    this.titlebar = new TitleBar({ title, className: "title-bar" });
    this.element.className = "topbar-window";
    this.windowButtons = new WindowButtons({
      isDialog,
      close,
      maximize: null,
      minimize: () => {}
    });
    this.windowButtons.load(this.element);
    this.titlebar.load(this.element);
    this.style = () => ({
      [this.id]: {
        borderTop: "#ccc",
        height: "32px",
        position: "relative",
        bottom: 0,
        left: 0,
        right: 0,
        background: "transparent",
        // zIndex: 9001,
        flex: "0 0 auto",
        display: "flex",
        flexFlow: "row nowrap"
      }
    });
  }
  mouseover() {}
  mouseout() {}
}

// export default topbar_old;
export default TopBar;
