import OSElement from "../../utils/OSElement";
import { color } from "../../theme";
import FluentButton from "../FluentButton";

class MenuItem extends OSElement {
  text: string;
  action: () => void;
  icon: HTMLElement;
  constructor({ icon, text, action }: { icon: HTMLElement; text: string; action: () => void }) {
    super("menuitem", "menu-item");
    this.text = text;
    this.action = action;
    this.style = () => ({
      [this.id]: {
        // width: "160px",
        maxWidth: "150px",
        height: "36px",
        margin: "10px 0",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        flexFlow: "row nowrap",
        borderRadius: "0px",
        cursor: "pointer",
        userSelect: "none",
        transition: "background 250ms ease",
        "&:hover": {
          background: color.hover
        }
      }
    });
    this.icon = icon;
    this.element.appendChild(this.icon);
    this.element.appendChild(document.createTextNode(this.text));
  }
  async load(element: HTMLElement) {
    await super.load(element);
    this.element.addEventListener("click", this.action);
  }
}

export default MenuItem;
