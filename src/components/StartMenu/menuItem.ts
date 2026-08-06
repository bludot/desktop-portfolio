import OSElement from "../../utils/OSElement";
import { color } from "../../theme";
import FluentButton from "../FluentButton";

class MenuItem extends OSElement {
  text: string;
  action: () => void;
  icon: HTMLElement;
  constructor({
    icon,
    text,
    action,
    external = false
  }: {
    icon: HTMLElement;
    text: string;
    action: () => void;
    /** Marks an item that leaves the desktop rather than opening a window. */
    external?: boolean;
  }) {
    super("menuitem", "menu-item");
    this.text = text;
    this.action = action;
    this.style = () => ({
      [this.id]: {
        /*
         * Fills the panel rather than capping its own width. The cap was 150px
         * while the panel sized itself to its widest child, so the menu came
         * out narrower than any of its rows wanted to be and every label sat in
         * a thin column with the trailing space unused.
         */
        width: "100%",
        boxSizing: "border-box",
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
        },
        // Pushed to the trailing edge, so the mark reads as a property of the
        // row rather than as part of the name.
        "& > .menu-external": {
          marginLeft: "auto",
          paddingRight: "10px",
          fontSize: "11px",
          lineHeight: 1,
          color: color.inkFaint
        }
      }
    });
    this.icon = icon;
    this.element.appendChild(this.icon);
    this.element.appendChild(document.createTextNode(this.text));

    if (external) {
      const mark = document.createElement("span");
      mark.className = "menu-external";
      // Decorative: the label below already says where the item goes.
      mark.setAttribute("aria-hidden", "true");
      mark.appendChild(document.createTextNode("↗"));
      this.element.appendChild(mark);
    }
  }
  async load(element: HTMLElement) {
    await super.load(element);
    this.element.addEventListener("click", this.action);
  }
}

export default MenuItem;
