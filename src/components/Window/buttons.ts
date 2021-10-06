import OSElement from "../../utils/OSElement";
import { TopbarButtonContruct } from "./interfaces";

class TopbarButton extends OSElement {
  icon: HTMLElement;
  action: () => void;
  color: string;
  constructor({ action, icon, color }: TopbarButtonContruct) {
    super("topbar-button", "topbar-button");
    this.action = action;
    this.color = color;
    this.icon = icon;
    this.element.appendChild(this.icon);
    this.style = () => ({
      [this.id]: {
        height: "24px",
        position: "relative",
        width: "24px",
        background: "transparent",
        lineHeight: "24px",
        textAlign: "center",
        padding: "4px",
        flex: "0 0 auto",
        display: "flex",
        justifyContent: "center",
        flexFlow: "column nowrap",
        alignItems: "center",
        color: "#666",
        fill: "#666",
        "&:hover": {
          color: "#000",
          fill: "#000"
        }
        // zIndex: 9001,
      }
    });
  }

  async load(element: HTMLElement) {
    super.load(element);
    this.element.addEventListener("click", this.action);
  }
}
class WindowButtons extends OSElement {
  buttons: TopbarButton[];
  constructor({ close, maximize, minimize }) {
    super("topbar-buttons", "topbar-buttons");
    this.buttons = [
      new TopbarButton({
        icon: (() => {
          const icon = new DOMParser().parseFromString(
            `<svg class="MuiSvgIcon-root jss179" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>`,
            "text/html"
          ).body.childNodes[0] as HTMLElement;
          icon.style.cssText = `
            width: 20px;
          `;
          return icon;
        })(),
        action: close,
        color: "red"
      }),
      new TopbarButton({
        icon: (() => {
          const icon = new DOMParser().parseFromString(
            `<svg class="MuiSvgIcon-root jss179" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13H5v-2h14v2z"></path></svg>`,
            "text/html"
          ).body.childNodes[0] as HTMLElement;
          icon.style.cssText = `
            width: 20px;
          `;
          return icon;
        })(),
        action: minimize,
        color: "#ccc"
      }),
      new TopbarButton({
        icon: (() => {
          const icon = new DOMParser().parseFromString(
            `<svg class="MuiSvgIcon-root jss179" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>`,
            "text/html"
          ).body.childNodes[0] as HTMLElement;
          icon.style.cssText = `
            width: 20px;
          `;
          return icon;
        })(),
        action: maximize,
        color: "#ccc"
      })
    ];
    this.style = () => ({
      [this.id]: {
        height: "32px",
        position: "relative",
        background: "transparent",
        lineHeight: "20px",
        flex: "0 1 auto",
        display: "flex",
        flexFlow: "row nowrap"
        // zIndex: 9001,
      }
    });
  }
  async load(element: HTMLElement) {
    super.load(element);
    this.buttons.forEach((button) => {
      button.load(this.element);
    });
  }
}

export default WindowButtons;
