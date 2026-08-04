import OSElement from "../../utils/OSElement";
import type { TaskbarButtonContruct } from "./interfaces";
import StartMenu from "./../StartMenu";
import windowManager from "../../utils/windowManager";
import { color, font, radius, size, tracking, weight } from "../../theme";
import type Desktop from "../Desktop";

class TaskbarButton extends OSElement {
  icon: HTMLElement;
  action: (element: HTMLElement) => void;
  color?: string;
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
        userSelect: "none",
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

  async load(element: HTMLElement) {
    super.load(element);
    this.element.addEventListener("click", () => {
      this.action(this.element);
    });
  }
}
class TaskbarButtons extends OSElement {
  buttons: TaskbarButton[];
  private openList!: HTMLElement;
  private status!: HTMLElement;
  private subscription?: { unsubscribe: () => void };
  constructor(desktop: Desktop) {
    super("taskbar-buttons", "taskbar-buttons");
    const startMenu = new StartMenu(desktop);
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
          span.appendChild(document.createTextNode("James"));
          span.style.cssText = `
            flex: 1 1 auto;
            display: inline-block;
            margin: 0 4px;
          `;
          container.appendChild(span);

          return container;
        })(),
        action: (element: HTMLElement) => {
          startMenu.load(document.querySelector("#app") as HTMLElement);
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
    this.openList = document.createElement("div");
    this.openList.className = "taskbar-open";
    this.status = document.createElement("div");
    this.status.className = "taskbar-status";

    this.style = () => ({
      [this.id]: {
        height: "40px",
        position: "relative",
        flex: "1 1 auto",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontFamily: font.ui,
        "& > .taskbar-open": {
          display: "flex",
          alignItems: "center",
          gap: "4px",
          flex: "1 1 auto",
          minWidth: 0
        },
        "& .taskbar-chip": {
          display: "flex",
          alignItems: "center",
          height: "32px",
          padding: "0 12px",
          border: "0",
          borderRadius: radius.pill,
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          letterSpacing: tracking.heading,
          cursor: "pointer",
          position: "relative",
          whiteSpace: "nowrap",
          transition: "background-color 130ms ease, color 130ms ease"
        },
        "& .taskbar-chip:hover": {
          background: color.chrome,
          color: color.ink
        },
        "& .taskbar-chip:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        "& .taskbar-chip.is-active": {
          background: color.chromeRaised,
          color: color.ink
        },
        // Second and last use of the accent on this screen.
        "& .taskbar-chip.is-active::after": {
          content: "''",
          position: "absolute",
          left: "12px",
          right: "12px",
          bottom: "3px",
          height: "2px",
          borderRadius: "1px",
          background: color.accent
        },
        "& > .taskbar-status": {
          display: "flex",
          alignItems: "center",
          gap: "14px",
          paddingRight: "8px",
          flex: "0 0 auto",
          fontFamily: font.mono,
          fontSize: size.caption,
          letterSpacing: ".05em",
          color: color.inkSoft,
          fontVariantNumeric: "tabular-nums"
        },
        "& .taskbar-pip": {
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color.current,
          boxShadow: `0 0 0 3px rgba(74,124,89,.16)`,
          display: "inline-block",
          marginRight: "7px"
        }
      }
    });
  }

  /** Redraw the chips from whatever the window manager currently holds. */
  private renderOpen() {
    this.openList.textContent = "";
    windowManager.list().forEach((open) => {
      const chip = document.createElement("button");
      chip.className = "taskbar-chip" + (open.active ? " is-active" : "");
      chip.type = "button";
      chip.appendChild(document.createTextNode(open.title));
      chip.addEventListener("click", () => open.window.onActive(open.window));
      this.openList.appendChild(chip);
    });
  }

  private renderStatus() {
    const available = document.createElement("span");
    const pip = document.createElement("span");
    pip.className = "taskbar-pip";
    available.appendChild(pip);
    available.appendChild(document.createTextNode("Available for work"));

    const where = document.createElement("span");
    where.appendChild(document.createTextNode("Bangkok \u00b7 UTC+7"));

    this.status.textContent = "";
    this.status.appendChild(available);
    this.status.appendChild(where);
  }

  async load(element: HTMLElement) {
    await super.load(element);
    for (const button of this.buttons) {
      await button.load(this.element);
    }
    this.element.appendChild(this.openList);
    this.element.appendChild(this.status);

    this.renderOpen();
    this.renderStatus();
    this.subscription = windowManager.subscribe(() => this.renderOpen());
  }

  async beforeUnload() {
    this.subscription?.unsubscribe();
  }
}

export default TaskbarButtons;
