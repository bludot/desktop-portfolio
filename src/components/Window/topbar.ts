import OSElement from "../../utils/OSElement";
import { color, space } from "../../theme";
import TitleBar from "./titlebar";
import WindowButtons from "./buttons";

class TopBar extends OSElement {
  titlebar: TitleBar;
  windowButtons: WindowButtons;
  constructor({
    title,
    close,
    minimize,
    maximize,
    isDialog,
    meta
  }: {
    title: string;
    close: () => void;
    minimize?: () => void;
    maximize?: () => void;
    isDialog?: boolean;
    meta?: string;
  }) {
    super("topbar", "topbar");
    this.titlebar = new TitleBar({ title, className: "title-bar", meta });
    this.element.className = "topbar-window";
    this.windowButtons = new WindowButtons({
      isDialog,
      close,
      maximize: maximize ?? null,
      minimize: minimize ?? (() => undefined)
    });
    // Order matters: the title leads, the controls sit at the trailing edge.
    this.titlebar.load(this.element);
    this.windowButtons.load(this.element);
    this.style = () => ({
      [this.id]: {
        height: space.titlebarHeight,
        position: "relative",
        background: "transparent",
        borderBottom: `1px solid ${color.lineSoft}`,
        padding: "0 7px 0 13px",
        gap: "9px",
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        flexFlow: "row nowrap",
        // The titlebar is a drag handle, so its label should never take a
        // selection or show a caret.
        userSelect: "none"
      }
    });
  }
  mouseover() {}
  mouseout() {}
}

// export default topbar_old;
export default TopBar;
