import OSElement from "../../utils/OSElement";
import type { TaskbarButtonContruct } from "./interfaces";
import StartMenu from "./../StartMenu";
import windowManager from "../../utils/windowManager";
import Switcher from "../Switcher";
import { motion } from "../../utils/motion";
import { color, font, radius, size, tracking, weight } from "../../theme";
import type Desktop from "../Desktop";
import { bindContextMenu } from "../ContextMenu";
import { icon as glyph, markFor } from "../Icon";
import Logger from "../../Logger";

/*
 * The launcher has a history of subtle ordering faults — a close landing inside
 * an open's await, a dismissal misjudging what it hit — and they are the kind
 * that only show up on someone else's machine. It says what it is doing, so
 * the next one can be read off the Debugger window (open with ?debug=1) rather
 * than guessed at.
 */
const logger = new Logger("Launcher");
import { currentRole } from "../../contents/experience/data";
import appearance from "../../utils/appearance";

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
            backgroundColor: color.hover
          }
        }
        // zIndex: 9001,
      }
    });
  }

  async load(element: HTMLElement) {
    await super.load(element);
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
  private appearanceSubscription?: { unsubscribe: () => void };
  private clock?: HTMLElement;
  private divider!: HTMLElement;
  private switcher!: HTMLButtonElement;
  private search!: HTMLButtonElement;
  /** Kept for the launcher, which is created on the desktop after this is. */
  private desktop: Desktop;
  private overview!: Switcher;
  private tick?: ReturnType<typeof setInterval>;
  constructor(desktop: Desktop) {
    super("taskbar-buttons", "taskbar-buttons");
    this.desktop = desktop;
    /*
     * The menu can put itself away, but it does not decide whether it is up —
     * that state lives here, with the button that toggles it. Pressing anything
     * on the board goes through this, so opening a window closes the menu
     * rather than leaving it over the thing it just opened.
     */
    const startMenu = new StartMenu(desktop, () => void queue(closeMenu));

    /*
     * The launcher is a toggle, so its state lives here rather than being
     * inferred. Previously each open registered a fresh pair of window click
     * listeners and there was no record of whether the menu was already up, so
     * pressing the button twice raced an open against a close.
     */
    let menuOpen = false;
    let startButton: HTMLElement | null = null;

    /*
     * Opens and closes run one at a time, never interleaved.
     *
     * Both of them await — loading the menu, then animating it — and a close
     * landing inside an open's await was enough to break the launcher for good:
     * the close would unload before the load had appended anything, so nothing
     * was removed, and then the load finished and appended the menu anyway. The
     * menu was on screen with the state saying it was shut, and the next click
     * called load() a second time, which throws.
     *
     * The rejection handler is the same task, so one failure retries rather
     * than wedging the queue for the rest of the session.
     */
    let pending: Promise<void> = Promise.resolve();
    const queue = (task: () => Promise<void>): Promise<void> => {
      pending = pending.then(task, task);
      return pending;
    };

    const onDocumentClick = (e: MouseEvent) => {
      // The button toggles itself; anything else dismisses. A click aimed
      // straight at window has window as its target, and Node.contains throws
      // on anything that is not a Node.
      const target = e.target instanceof Node ? e.target : null;
      const inside = !!(target && startButton && startButton.contains(target));
      logger.debug(
        `dismiss: inside=${inside} open=${menuOpen} target=${
          target instanceof Element ? target.tagName.toLowerCase() : "window"
        }`
      );
      if (inside) return;
      void queue(closeMenu);
    };

    // Read inside the queued task, not when it is queued: by the time this
    // runs, an earlier click may already have changed the answer.
    const toggleMenu = () =>
      queue(async () => {
        if (menuOpen) {
          await closeMenu();
        } else {
          await openMenu();
        }
      });

    const openMenu = async () => {
      logger.debug(`open: alreadyOpen=${menuOpen}`);
      if (menuOpen) return;
      menuOpen = true;

      const el = startMenu.getElement();

      /*
       * Attached now rather than after the await. Capture on window runs before
       * the event reaches the button, so this click is already past that phase
       * and cannot re-enter here — whereas deferring registration left a gap in
       * which a click landed with the menu open and nothing listening.
       */
      window.addEventListener("click", onDocumentClick, true);

      /*
       * Whatever happens in between, the menu must not be left hidden.
       *
       * It is hidden here and shown again three lines down, and anything that
       * threw between the two — a load that found the element still mounted,
       * an animation that rejected — left it in the page at zero opacity with
       * the state insisting it was open. Nothing appeared, and the next press
       * closed the invisible menu rather than opening a visible one, so it took
       * two presses to see anything.
       */
      try {
        await startMenu.load(document.querySelector("#app") as HTMLElement);
        // `enter` owns the hide and the reveal. Doing it here by hand is what
        // made the menu blink as it finished opening: the entrance fills
        // backwards, so on its last frame the element fell back to the inline
        // `opacity: 0` that was only cleared after the await.
        await motion.enter(el, motion.popIn);
      } catch (error) {
        /*
         * An open that failed is not an open. Leaving the state saying it was
         * is what made the launcher need two presses afterwards: the next one
         * closed a menu that had never appeared, and only the one after it
         * opened anything.
         */
        logger.debug(`open failed: ${error}`);
        menuOpen = false;
        window.removeEventListener("click", onDocumentClick, true);
        try {
          await startMenu.unload();
        } catch {
          // Never loaded, so there is nothing to take down.
        }
      } finally {
        // Belt and braces for the failure path: `enter` clears this itself on
        // the way through, and a menu that threw must not be left invisible.
        el.style.opacity = "";
      }

      logger.debug(
        `open done: mounted=${!!el.parentElement} opacity=${
          el.isConnected ? getComputedStyle(el).opacity : "n/a"
        } held=${el.getAnimations?.().length ?? 0}`
      );
    };

    const closeMenu = async () => {
      logger.debug(`close: wasOpen=${menuOpen}`);
      if (!menuOpen) return;
      menuOpen = false;
      window.removeEventListener("click", onDocumentClick, true);
      /*
       * The same, in reverse: a failure here must still unload, or the element
       * stays mounted and the next load() throws because it already has a
       * parent.
       */
      try {
        await motion.popOut(startMenu.getElement());
      } catch (error) {
        logger.debug(`close animation failed: ${error}`);
      }
      try {
        await startMenu.unload();
      } catch (error) {
        logger.debug(`close failed: ${error}`);
      }
    };

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
          span.className = "taskbar-name";
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
          logger.debug(`pressed: open=${menuOpen}`);
          startButton = element;
          void toggleMenu();
        }
      })
    ];
    // Read lazily: the taskbar is still being constructed around us.
    this.overview = new Switcher({
      taskbarHeight: () => desktop.getTaskbar().getElement().clientHeight,
      scrimHost: () => desktop.getElement()
    });

    this.switcher = document.createElement("button");
    this.switcher.className = "taskbar-switcher";
    this.switcher.type = "button";

    /*
     * The way in to the launcher for anybody who does not know it is there.
     *
     * A command palette reached only by a shortcut is reachable only by people
     * who already know the shortcut, which on a portfolio is nobody. The chip
     * carries the shortcut as its label, so pressing it once teaches the faster
     * way — and on a phone, where there is no ⌘K to press, it is the only way.
     */
    this.search = document.createElement("button");
    this.search.className = "taskbar-search";
    this.search.type = "button";
    this.search.setAttribute("aria-label", "Search apps, windows and projects");
    this.search.appendChild(glyph("search"));
    const shortcut = document.createElement("span");
    shortcut.className = "taskbar-search-key";
    shortcut.setAttribute("aria-hidden", "true");
    // One token, not two words: the non-breaking space that used to hold
    // these together rendered as a visible gap in the mono face, and ⌘K is
    // read as a single key anyway.
    shortcut.appendChild(document.createTextNode("⌘K"));
    this.search.appendChild(shortcut);

    this.divider = document.createElement("span");
    this.divider.className = "taskbar-divider";
    this.divider.setAttribute("aria-hidden", "true");

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
        "& > .taskbar-divider": {
          width: "1px",
          height: "24px",
          background: color.line,
          flex: "0 0 auto"
        },
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
        // Still open, just not on screen. Dimmed rather than hidden, or the
        // taskbar would look like it had lost a window.
        "& .taskbar-chip.is-minimized": {
          opacity: 0.55
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
        "& > .taskbar-switcher": {
          // Present at every width: it is a shortcut on the desktop and the
          // only way to change windows once the chips are gone.
          display: "flex",
          alignItems: "center",
          gap: "7px",
          height: "34px",
          padding: "0 12px",
          border: "0",
          borderRadius: radius.pill,
          background: color.chromeRaised,
          color: color.ink,
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          fontVariantNumeric: "tabular-nums",
          cursor: "pointer"
        },
        "& > .taskbar-search": {
          display: "flex",
          alignItems: "center",
          gap: "7px",
          flex: "0 0 auto",
          height: "28px",
          padding: "0 10px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.pill,
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.caption,
          cursor: "pointer"
        },
        "& > .taskbar-search:hover": { background: color.chrome, color: color.ink },
        "& > .taskbar-search:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        "& > .taskbar-search svg": { width: "13px", height: "13px" },
        "& > .taskbar-search .taskbar-search-key": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: ".04em",
          color: color.inkFaint
        },
        "& > .taskbar-switcher svg": {
          width: "15px",
          height: "15px"
        },
        "& > .taskbar-switcher:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        /*
         * Width, not user agent. The old layout branched on is-mobile, so a
         * narrow desktop window kept the full bar and the name, chips and
         * status all squeezed against each other.
         */
        "@media (max-width: 760px)": {
          "& > .taskbar-open": { display: "none" },
          "& > .taskbar-divider": { display: "none" },
          "& .taskbar-name": { display: "none" },
          "& > .taskbar-status > span:not(:last-child)": { display: "none" }
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

  /** Open the overview, for callers that have no business owning it. */
  showOverview(host: HTMLElement) {
    return this.overview.toggle(host);
  }

  /** Redraw the chips from whatever the window manager currently holds. */
  private seen = new Set<string>();

  private renderOpen() {
    const current = new Set(windowManager.list().map((o) => o.title));
    this.openList.textContent = "";
    windowManager.list().forEach((open) => {
      const chip = document.createElement("button");
      chip.className =
        "taskbar-chip" +
        (open.active ? " is-active" : "") +
        (open.minimized ? " is-minimized" : "");
      chip.type = "button";
      /*
       * Whatever this window is drawn as everywhere else.
       *
       * The chips used to keep their own three-entry table of glyphs, so
       * Projects and every app had a label and no mark — the same window with
       * an icon in the menu and none here. `markFor` is now the one answer.
       */
      const mark = markFor(open.title);
      if (mark) chip.appendChild(mark);
      const label = document.createElement("span");
      label.appendChild(document.createTextNode(open.title));
      chip.appendChild(label);

      /*
       * The behaviour every taskbar has: bring it back if it is hidden, put it
       * away if it is already the one in front, and otherwise raise it. Without
       * the first of those a minimised window would have no way back.
       */
      chip.addEventListener("click", () => {
        if (open.minimized) {
          void open.window.restore();
        } else if (open.active) {
          void open.window.minimize();
        } else {
          open.window.onActive(open.window);
        }
      });
      // The same menu the window's own titlebar offers — a chip is another way
      // of pointing at that window, not a different thing to act on.
      bindContextMenu(chip, () => open.window.menuItems());

      this.openList.appendChild(chip);

      if (!this.seen.has(open.title)) motion.chipIn(chip);
    });

    this.seen = current;
  }

  private renderClock() {
    if (!this.clock) return;
    /*
     * The viewer's own time, in the viewer's own zone — no `timeZone` here on
     * purpose. A taskbar clock is read as "what time is it", so pinning it to
     * where James happens to live told everyone else the wrong time. His
     * location still sits beside it, but attached to his availability rather
     * than to the clock.
     */
    const clock24 = appearance.get().clock24;
    this.clock.textContent = new Intl.DateTimeFormat(
      clock24 ? "en-GB" : undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: !clock24
      }
    ).format(new Date());
  }

  /**
   * Below the breakpoint the chip list is replaced by a single button that
   * opens the same windows as a list. Chips do not shrink gracefully — two of
   * them already crowd a phone — so they collapse rather than squeeze.
   */
  private renderSwitcher() {
    const open = windowManager.list();
    this.switcher.textContent = "";

    this.switcher.appendChild(glyph("windows"));

    const count = document.createElement("span");
    count.appendChild(document.createTextNode(String(open.length)));
    this.switcher.appendChild(count);

    this.switcher.setAttribute(
      "aria-label",
      `Show all windows, ${open.length} open`
    );
  }

  private renderStatus() {
    /*
     * Read off the roles in Experience rather than written down twice. The bar
     * used to claim availability unconditionally, which would have gone stale
     * the moment a current role was added and contradicted the window next to
     * it.
     */
    const role = currentRole();

    const available = document.createElement("span");
    const pip = document.createElement("span");
    pip.className = "taskbar-pip";
    available.appendChild(pip);
    available.appendChild(
      document.createTextNode(
        role ? `Working at ${role.company}` : "Available for work"
      )
    );

    const where = document.createElement("span");
    where.appendChild(document.createTextNode("Fort Lauderdale, FL"));

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
    this.element.appendChild(this.divider);
    this.element.appendChild(this.openList);
    this.element.appendChild(this.search);
    this.element.appendChild(this.switcher);
    this.element.appendChild(this.status);

    this.renderOpen();
    this.renderSwitcher();
    this.renderStatus();
    this.subscription = windowManager.subscribe(() => {
      this.renderOpen();
      this.renderSwitcher();
    });
    // The clock's format is a setting, so it has to redraw when that changes
    // rather than waiting up to thirty seconds for the next tick.
    this.appearanceSubscription = appearance.subscribe(() => {
      this.renderClock();
      this.renderStatus();
    });

    this.switcher.addEventListener("click", () => {
      void this.overview.toggle(document.querySelector("#app") as HTMLElement);
    });
    this.search.addEventListener("click", () => {
      void this.desktop.launcher?.toggle();
    });
  }

  async beforeUnload() {
    this.subscription?.unsubscribe();
    this.appearanceSubscription?.unsubscribe();
    if (this.tick) clearInterval(this.tick);
  }
}

export default TaskbarButtons;
