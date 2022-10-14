import OSElement from "../../utils/OSElement";
import FluentButton from "../FluentButton";

class MenuItem extends OSElement {
  text: string;
  action: () => void;
  icon: HTMLElement;
  constructor({ icon, text, action }) {
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
        transition: "background 250ms ease",
        "&:hover": {
          background: "rgba(255,255,255,.5)"
        }
      }
    });
    this.icon = icon;
    this.element.appendChild(this.icon);
    this.element.appendChild(document.createTextNode(this.text));
  }
  async load(element: HTMLElement | Element) {
    super.load(element);
    this.element.addEventListener("click", this.action);
  }
}

export default MenuItem;
