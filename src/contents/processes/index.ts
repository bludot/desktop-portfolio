import OSElement from "../../utils/OSElement";
import { color, font, radius, size, space, tracking, weight } from "../../theme";
import * as processes from "../../processes";
import type { Process } from "../../processes";

/**
 * What is running, and what it would cost to stop it.
 *
 * The desktop metaphor has always been half a joke here — windows that draw
 * themselves, a start menu, a taskbar — and this is the point where it stops
 * being one. Something on this page really does outlive the window that started
 * it: the chat model stays up after its window closes, which is the only reason
 * re-opening it is instant. A person who can see that a model is resident and
 * can choose to let go of it is being told the truth about their own machine.
 *
 * Killing is the honest verb. It stops the thing and releases what it held; the
 * next window that wants it pays the load again, which is stated here rather
 * than discovered.
 */

/** How long it has been up, in the roughest unit that is still true. */
export function uptime(since: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - since.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

class ProcessesContent extends OSElement {
  private table!: HTMLElement;
  private empty!: HTMLElement;
  /** How to stop being told about the register. Called on unload. */
  private unwatch?: () => void;
  /**
   * Redraws the uptimes while the window is open.
   *
   * A process table whose ages are frozen at the moment it was opened is worse
   * than one with no ages at all: it looks live and is not.
   */
  private ticking?: ReturnType<typeof setInterval>;

  constructor() {
    super("processescontent", "processes-content");

    this.style = () => ({
      [this.id]: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        fontFamily: font.ui,
        fontSize: size.bodyTight,
        color: color.ink,

        "& .proc-head": {
          flex: "0 0 auto",
          display: "flex",
          gap: "9px",
          alignItems: "baseline",
          padding: `9px ${space.windowPadX}`,
          borderBottom: `1px solid ${color.lineSoft}`,
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },

        "& .proc-list": {
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "auto",
          padding: "6px 0"
        },

        "& .proc-row": {
          display: "flex",
          gap: "12px",
          alignItems: "center",
          padding: `10px ${space.windowPadX}`
        },
        "& .proc-row + .proc-row": { borderTop: `1px solid ${color.lineSoft}` },

        "& .proc-what": { flex: "1 1 auto", minWidth: 0 },
        "& .proc-name": {
          fontWeight: weight.emphasise,
          lineHeight: 1.3
        },
        "& .proc-detail": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          lineHeight: 1.3,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },

        "& .proc-up": {
          flex: "0 0 auto",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },

        "& .proc-kill": {
          flex: "0 0 auto",
          border: `1px solid ${color.lineSoft}`,
          background: "transparent",
          borderRadius: radius.control,
          color: color.ink,
          font: "inherit",
          fontSize: size.micro,
          padding: "3px 9px",
          cursor: "pointer",
          transition: "background 150ms ease"
        },
        "& .proc-kill:hover": { background: color.hover },

        "& .proc-empty": {
          padding: `15px ${space.windowPadX}`,
          color: color.inkFaint,
          lineHeight: 1.5
        }
      }
    });
  }

  async beforeLoad() {
    const head = document.createElement("p");
    head.className = "proc-head";
    head.appendChild(document.createTextNode("RUNNING"));
    this.element.appendChild(head);

    this.table = document.createElement("div");
    this.table.className = "proc-list";
    this.element.appendChild(this.table);

    this.empty = document.createElement("p");
    this.empty.className = "proc-empty";
    /*
     * Said as a fact about this desktop rather than as an apology. Nothing
     * running is the ordinary state — every process here is started by opening
     * something, and a visitor who has opened nothing heavy has none.
     */
    this.empty.appendChild(
      document.createTextNode(
        "Nothing is running. Opening the chat window starts the model, and it stays up after that window closes."
      )
    );

    this.draw();
    this.unwatch = processes.watch(() => this.draw());
    this.ticking = setInterval(() => this.draw(), 1000);
  }

  private row(process: Process): HTMLElement {
    const row = document.createElement("div");
    row.className = "proc-row";

    const what = document.createElement("div");
    what.className = "proc-what";

    const name = document.createElement("div");
    name.className = "proc-name";
    name.appendChild(document.createTextNode(process.label));
    what.appendChild(name);

    const detail = process.detail();
    if (detail) {
      const line = document.createElement("div");
      line.className = "proc-detail";
      line.appendChild(document.createTextNode(detail));
      what.appendChild(line);
    }
    row.appendChild(what);

    const up = document.createElement("span");
    up.className = "proc-up";
    up.appendChild(document.createTextNode(uptime(process.since)));
    row.appendChild(up);

    const kill = document.createElement("button");
    kill.type = "button";
    kill.className = "proc-kill";
    kill.appendChild(document.createTextNode("Kill"));
    // No confirmation. Nothing here holds anything a person typed — the model
    // is weights, and the cost of being wrong is one reload.
    kill.addEventListener("click", () => process.kill());
    row.appendChild(kill);

    return row;
  }

  /**
   * Rebuild the list.
   *
   * Wholesale rather than diffed, once a second at most and only while the
   * window is open: the table is a handful of rows, and a fresh build is
   * cheaper to reason about than keeping one in step with a register that
   * anything on the desktop may change.
   */
  private draw() {
    const running = processes.list();
    this.table.textContent = "";
    if (!running.length) {
      this.table.appendChild(this.empty);
      return;
    }
    running.forEach((process) => this.table.appendChild(this.row(process)));
  }

  async beforeUnload() {
    this.unwatch?.();
    this.unwatch = undefined;
    if (this.ticking) clearInterval(this.ticking);
    this.ticking = undefined;
  }
}

export default ProcessesContent;
