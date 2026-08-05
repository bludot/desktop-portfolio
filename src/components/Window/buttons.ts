import OSElement from "../../utils/OSElement";
import { color as palette, radius } from "../../theme";
import type { TopbarButtonContruct, WindowButtonsContruct } from "./interfaces";

class TopbarButton extends OSElement {
  icon: HTMLElement;
  action: () => void;
  color: string;
  constructor({ action, icon, color, isClose }: TopbarButtonContruct) {
    super("topbar-button", "topbar-button");
    this.action = action;
    this.color = color;
    if (isClose) this.element.classList.add("window-close");
    this.icon = icon;
    this.element.appendChild(this.icon);
    this.style = () => ({
      [this.id]: {
        height: "22px",
        position: "relative",
        width: "24px",
        background: "transparent",
        borderRadius: radius.control,
        lineHeight: "22px",
        textAlign: "center",
        padding: "4px",
        flex: "0 0 auto",
        display: "flex",
        justifyContent: "center",
        flexFlow: "column nowrap",
        alignItems: "center",
        cursor: "pointer",
        color: palette.inkFaint,
        fill: palette.inkFaint,
        transition: "background-color 130ms ease, color 130ms ease",
        "&:hover": {
          background: palette.hover,
          color: palette.ink,
          fill: palette.ink
        },
        // Close is the only control that ever takes the accent, so the
        // destructive one is the only thing in the chrome that turns colour.
        "&.window-close:hover": {
          background: palette.accent,
          color: "#fff",
          fill: "#fff"
        },
        "&:focus-visible": {
          outline: `2px solid ${palette.accent}`,
          outlineOffset: "1px"
        }
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
  constructor({ isDialog, close, maximize, minimize }: WindowButtonsContruct) {
    super("topbar-buttons", "topbar-buttons");
    if (isDialog) {
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
          color: "red",
          isClose: true
        }),
        ]
    } else {
      this.buttons = [
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
          color: palette.inkFaint
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
          action: maximize ?? (() => {}),
          color: palette.inkFaint
        }),
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
          color: "red",
          isClose: true
        })
      ];
    }
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
