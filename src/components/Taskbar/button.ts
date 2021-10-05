import OSElement from "../../utils/OSElement";
import { TaskbarButtonContruct } from "./interfaces";
import StartMenu from "./../StartMenu";

class TaskbarButton extends OSElement {
  icon: HTMLElement;
  action: (element: HTMLElement) => void;
  color: string;
  constructor({ action, icon }: TaskbarButtonContruct) {
    super("taskbar-button", "taskbar-button");
    this.action = action;
    this.icon = icon;
    this.element.appendChild(this.icon);
    this.style = () => ({
      [this.id]: {
        height: "50px",
        position: "relative",
        lineHeight: "35px",
        textAlign: "center",
        flex: "0 0 auto",
        display: "flex",
        justifyContent: "center",
        flexFlow: "column nowrap",
        alignItems: "center",
        cursor: "pointer",
        "&:before": {
          content: "''",
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          left: 0,
          borderRadius: "8px",
          margin: "5px",
          transition: "background-color 150ms ease"
        },
        "&:hover": {
          "&:before": {
            backgroundColor: "rgba(255,255,255,.5)"
          }
        }
        // zIndex: 9001,
      }
    });
  }

  load(element: HTMLElement) {
    super.load(element);
    this.element.addEventListener("click", () => {
      this.action(this.element);
    });
  }
}
class TaskbarButtons extends OSElement {
  buttons: TaskbarButton[];
  constructor() {
    super("taskbar-buttons", "taskbar-buttons");
    const startMenu = new StartMenu();
    this.buttons = [
      new TaskbarButton({
        icon: (() => {
          const container = document.createElement("div");
          container.style.cssText = `
            display: flex;
            flex-flow: row nowrap;
            flex: 1 1 auto;
            align-items: center;
            margin: 5px;
            z-index: 1;
          `;
          const icon = document.createElement("div");
          icon.style.cssText = `
            flex: 1 1 auto;
            width: 25px;
            height: 25px;
            background-image: url(http://placekitten.com/40/40);
            background-size: cover;
            background-position: center;
            border-radius: 100%;
            border: 1px solid #666;
            display: inline-block;
            margin: 0 4px;
          `;
          container.appendChild(icon);
          const span = document.createElement("span");
          span.appendChild(document.createTextNode("Bobet"));
          span.style.cssText = `
            flex: 1 1 auto;
            display: inline-block;
            margin: 0 4px;
          `;
          container.appendChild(span);

          return container;
        })(),
        action: (element: HTMLElement) => {
          startMenu.load(document.querySelector("#app"));
          const unload = startMenu.unload.bind(startMenu);
          window.addEventListener("click", unload, true);
          window.addEventListener(
            "click",
            () => {
              window.removeEventListener("click", unload, true);
            },
            true
          );
        }
      })
    ];
    this.style = () => ({
      [this.id]: {
        height: "35px",
        position: "relative",
        lineHeight: "35px",
        flex: "0 1 auto",
        display: "flex",
        flexFlow: "row nowrap"
        // zIndex: 9001,
      }
    });
  }
  load(element: HTMLElement) {
    super.load(element);
    this.buttons.forEach((button) => {
      button.load(this.element);
    });
  }
}

export default TaskbarButtons;
