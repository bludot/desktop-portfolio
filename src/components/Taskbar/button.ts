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
/** Chip glyphs, matching the ones the launcher uses. */
const GLYPHS: Record<string, string> = {
  About: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/></svg>`,
  Experience: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="7.5" width="18" height="12.5" rx="1.6"/><path d="M8.5 7.5V6A1.5 1.5 0 0 1 10 4.5h4A1.5 1.5 0 0 1 15.5 6v1.5"/></svg>`,
  Debugger: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m5.5 8.5 4 3.5-4 3.5M12.5 16h6"/></svg>`
};

const glyphFor = (title: string): string | undefined => GLYPHS[title];

class TaskbarButtons extends OSElement {
  buttons: TaskbarButton[];
  private openList!: HTMLElement;
  private status!: HTMLElement;
  private subscription?: { unsubscribe: () => void };
  private clock?: HTMLElement;
  private tick?: ReturnType<typeof setInterval>;
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
            flex: 0 0 auto;
            width: 26px;
            height: 26px;
            background: linear-gradient(150deg, #d8b4c4, #a87d97);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.5);
            border-radius: 100%;
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
          gap: "8px",
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
        "& .taskbar-chip svg": {
          width: "14px",
          height: "14px",
          flex: "0 0 auto"
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
      const glyph = glyphFor(open.title);
      if (glyph) {
        chip.appendChild(
          new DOMParser().parseFromString(glyph, "image/svg+xml").documentElement
        );
      }
      const label = document.createElement("span");
      label.appendChild(document.createTextNode(open.title));
      chip.appendChild(label);

      chip.addEventListener("click", () => open.window.onActive(open.window));
      this.openList.appendChild(chip);
    });
  }

  private renderClock() {
    if (!this.clock) return;
    // Bangkok, since that is what the line beside it claims.
    this.clock.textContent = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok"
    }).format(new Date());
  }

  private renderStatus() {
    const available = document.createElement("span");
    const pip = document.createElement("span");
    pip.className = "taskbar-pip";
    available.appendChild(pip);
    available.appendChild(document.createTextNode("Available for work"));

    const where = document.createElement("span");
    where.appendChild(document.createTextNode("Bangkok \u00b7 UTC+7"));

    this.clock = document.createElement("span");

    this.status.textContent = "";
    this.status.appendChild(available);
    this.status.appendChild(where);
    this.status.appendChild(this.clock);

    this.renderClock();
    this.tick = setInterval(() => this.renderClock(), 30_000);
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
    if (this.tick) clearInterval(this.tick);
  }
}

export default TaskbarButtons;
