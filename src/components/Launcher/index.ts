import OSElement from "../../utils/OSElement";
import { color, font, motion as motionToken, radius, size, tracking, weight } from "../../theme";
import windowManager from "../../utils/windowManager";
import { APPS, openAppWindow, type App } from "../../apps/external";
import appIcon from "../AppIcon";
import { loadRepos, type Repo } from "../../utils/github";
import { GROUP_ORDER, SEARCH_URL, search, type Group, type Result } from "./results";
import type Desktop from "../Desktop";

/** Below this the panel is the screen rather than a card on it. */
const SHEET_PX = 620;

export interface LauncherActions {
  toggleTheme: () => void;
  showAll: () => void;
  minimizeAll: () => void;
  settings: () => void;
  openProjects: (repo?: Repo) => void;
}

/**
 * Type at the desktop.
 *
 * One field over everything, searching what is installed, what is open, what
 * has been written, and what the desktop itself can do. It exists because the
 * alternative scales badly: a menu is fine for six things and unusable for
 * ninety, and this desktop has ninety.
 *
 * Mounted beside the desktop rather than inside it, for the reason the context
 * menu is: the desktop clips its overflow and is the element the overview
 * scales, and a panel inside it would be cut off at its edges and dragged
 * around by anything that moved it.
 */
class Launcher extends OSElement {
  private desktop: Desktop;
  private actions: LauncherActions;

  private input!: HTMLInputElement;
  private list!: HTMLElement;
  private empty!: HTMLElement;
  private scrim!: HTMLElement;

  private open = false;
  private results: Result[] = [];
  private cursor = 0;
  /**
   * Fetched once, on the first open, and kept.
   *
   * `loadRepos` answers from a cache that survives the session, so this is
   * mostly about not asking for eighty-seven repositories before anybody has
   * shown an interest in searching them.
   */
  private repos: Repo[] = [];
  private askedForRepos = false;

  constructor(desktop: Desktop, actions: LauncherActions) {
    super("Launcher", "launcher");
    this.desktop = desktop;
    this.actions = actions;

    this.scrim = document.createElement("div");
    this.scrim.className = "launcher-scrim";

    /*
     * One rule for the root, with everything else nested under it.
     *
     * `jss.createStyleSheet` treats each top-level key as a rule to generate a
     * scoped class name for — so a key like ".launcher-panel" does not select
     * the panel, it invents a class nobody wears. Written flat, this whole
     * component rendered unstyled: a panel with no background, no position and
     * no way to be hidden. The `&` nesting is what makes these real selectors.
     */
    this.style = () => ({
      [this.id]: {
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        zIndex: "9998",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "12vh 16px 16px",
        fontFamily: font.ui,

        /*
         * Hidden by visibility rather than by display, because `display` has
         * nothing to transition between — a panel that is not laid out cannot
         * fade. `visibility` still takes it out of the pointer's way and off
         * the accessibility tree, and delaying it by the length of the fade on
         * the way out keeps the panel on screen long enough to be seen going.
         */
        visibility: "hidden",
        transition: `visibility 0s linear ${motionToken.base}ms`,

        "&.is-open": {
          visibility: "visible",
          transition: "visibility 0s"
        },

        // Inside the root rather than mounted separately, so it is hidden and
        // shown by the same class the panel is.
        /*
         * The blur is fixed and its opacity is what moves.
         *
         * Animating `backdrop-filter` from 0 to 3px asks the compositor to
         * re-filter the entire desktop — wallpaper, windows and all — on every
         * frame, and it drops enough of them that the blur appears to arrive in
         * one step. Held constant, the filtered layer is produced once and
         * faded, which is a compositor property and costs nothing per frame.
         */
        "& > .launcher-scrim": {
          position: "fixed",
          inset: "0",
          opacity: 0,
          background: "rgba(12, 8, 18, .32)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          transition: `opacity ${motionToken.base}ms ${motionToken.standard}`
        },
        "&.is-open > .launcher-scrim": { opacity: 1 },

        // Rises the last few pixels into place, so the panel reads as coming
        // forward rather than being pasted on.
        "& > .launcher-panel": {
          position: "relative",
          opacity: 0,
          transform: "translateY(-8px) scale(.985)",
          transition: [
            `opacity ${motionToken.fast}ms ${motionToken.standard}`,
            `transform ${motionToken.base}ms ${motionToken.standard}`
          ].join(", "),
          width: "min(560px, 100%)",
          maxHeight: "min(60vh, 520px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: radius.window,
          background: color.glass,
          backdropFilter: "blur(28px) saturate(1.4)",
          WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          boxShadow: `var(--shadow-window), inset 0 0 0 1px ${color.glassEdge}`
        },

        "&.is-open > .launcher-panel": { opacity: 1, transform: "none" },

        /*
         * Nothing moves for somebody who asked for less movement, but the panel
         * still has to arrive and leave — so the change is instant rather than
         * absent, which is what `motion` does everywhere else on this desktop.
         */
        "@media (prefers-reduced-motion: reduce)": {
          transition: "visibility 0s",
          "& > .launcher-scrim, & > .launcher-panel": { transition: "none" }
        },

        "& .launcher-field": {
          display: "flex",
          alignItems: "center",
          gap: "11px",
          padding: "14px 16px",
          borderBottom: `1px solid ${color.lineSoft}`,
          flex: "0 0 auto"
        },
        "& .launcher-field svg": {
          width: "15px",
          height: "15px",
          flex: "0 0 auto",
          color: color.inkFaint
        },
        "& .launcher-input": {
          flex: "1 1 auto",
          minWidth: 0,
          border: "0",
          background: "none",
          outline: "none",
          font: "inherit",
          fontSize: size.heading,
          letterSpacing: "-.006em",
          color: color.ink
        },
        "& .launcher-input::placeholder": { color: color.inkFaint },

        "& .launcher-list": {
          flex: "1 1 auto",
          overflowY: "auto",
          padding: "6px 7px 8px",
          margin: "0",
          listStyle: "none",
          minHeight: 0
        },
        "& .launcher-group": {
          display: "block",
          padding: "9px 10px 4px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: color.inkFaint
        },
        "& .launcher-row": {
          display: "flex",
          alignItems: "center",
          gap: "11px",
          padding: "8px 10px",
          borderRadius: radius.control,
          cursor: "pointer"
        },
        // Follows the keyboard, not the pointer: with both, moving the mouse
        // across the panel would silently change what Enter does.
        "& .launcher-row.is-active": { background: color.chromeRaised },
        "& .launcher-glyph": {
          width: "25px",
          height: "25px",
          flex: "0 0 auto",
          display: "grid",
          placeItems: "center",
          borderRadius: "7px",
          background: color.chrome,
          color: color.inkSoft,
          fontFamily: font.mono,
          fontSize: size.caption
        },
        "& .launcher-text": { minWidth: 0, flex: "1 1 auto" },
        "& .launcher-name": {
          display: "block",
          fontSize: size.bodyTight,
          color: color.ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        },
        "& .launcher-sub": {
          display: "block",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        },
        "& .launcher-badge": {
          flex: "0 0 auto",
          fontFamily: font.mono,
          fontSize: "9.5px",
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: color.inkFaint,
          border: `1px solid ${color.line}`,
          borderRadius: "4px",
          padding: "1px 5px"
        },
        "& .launcher-empty": {
          display: "none",
          padding: "18px 17px 22px",
          fontSize: size.bodyTight,
          color: color.inkSoft
        },
        "& .launcher-empty.is-shown": { display: "block" },

        "& .launcher-foot": {
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "9px 14px",
          borderTop: `1px solid ${color.lineSoft}`,
          background: color.chrome,
          fontSize: size.caption,
          color: color.inkFaint
        },
        "& .launcher-foot b": { fontWeight: weight.read, color: color.inkSoft },
        "& .launcher-foot .spacer": { marginLeft: "auto" },

        /*
         * A phone gets the whole screen. A 560px card in a 380px viewport is a
         * card with no room for its own results, and the keyboard takes half of
         * what is left.
         */
        [`@media (max-width: ${SHEET_PX}px)`]: {
          padding: "0",
          "& > .launcher-panel": {
            width: "100%",
            height: "100%",
            maxHeight: "none",
            borderRadius: "0"
          }
        }
      }
    });

    const panel = document.createElement("div");
    panel.className = "launcher-panel";

    const field = document.createElement("div");
    field.className = "launcher-field";
    field.appendChild(
      new DOMParser().parseFromString(
        // Namespaced, or the XML parser hands back an "svg" element that belongs
        // to no namespace, takes its size from the stylesheet and draws nothing.
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4 14 14"/></svg>`,
        "image/svg+xml"
      ).documentElement
    );

    this.input = document.createElement("input");
    this.input.className = "launcher-input";
    this.input.type = "text";
    this.input.placeholder = "Search apps, windows, projects…";
    this.input.setAttribute("aria-label", "Search the desktop");
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-expanded", "true");
    this.input.setAttribute("aria-controls", "launcher-results");
    this.input.autocomplete = "off";
    this.input.spellcheck = false;
    field.appendChild(this.input);

    this.list = document.createElement("ul");
    this.list.className = "launcher-list";
    this.list.id = "launcher-results";
    this.list.setAttribute("role", "listbox");
    this.list.setAttribute("aria-label", "Results");

    this.empty = document.createElement("p");
    this.empty.className = "launcher-empty";

    const foot = document.createElement("div");
    foot.className = "launcher-foot";
    foot.appendChild(hint("↑↓", "move"));
    foot.appendChild(hint("↵", "open"));
    const spacer = document.createElement("span");
    spacer.className = "spacer";
    spacer.appendChild(hint("esc", "close").firstChild!);
    spacer.appendChild(document.createTextNode(" close"));
    foot.appendChild(spacer);

    panel.append(field, this.list, this.empty, foot);
    this.element.append(this.scrim, panel);

    this.input.addEventListener("input", () => {
      this.cursor = 0;
      this.render();
    });
    this.element.addEventListener("keydown", this.onKeyDown);
    this.scrim.addEventListener("mousedown", () => void this.hide());
  }

  async load(element: HTMLElement) {
    await super.load(element);
    window.addEventListener("keydown", this.onGlobalKey, true);
  }

  async unload() {
    window.removeEventListener("keydown", this.onGlobalKey, true);
    await super.unload();
  }

  isOpen(): boolean {
    return this.open;
  }

  /**
   * ⌘K, or Ctrl+K where there is no ⌘.
   *
   * On capture, because a window's content may be focused and would otherwise
   * see the key first — a text field inside an app would swallow it.
   */
  private onGlobalKey = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void this.toggle();
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        void this.hide();
        return;
      case "ArrowDown":
        e.preventDefault();
        this.move(1);
        return;
      case "ArrowUp":
        e.preventDefault();
        this.move(-1);
        return;
      case "Home":
        e.preventDefault();
        this.cursor = 0;
        this.paint();
        return;
      case "End":
        e.preventDefault();
        this.cursor = Math.max(0, this.results.length - 1);
        this.paint();
        return;
      case "Enter":
        e.preventDefault();
        this.choose(this.results[this.cursor]);
        return;
      default:
    }
  };

  private move(delta: number) {
    if (!this.results.length) return;
    const count = this.results.length;
    // Wraps, so holding one arrow always reaches everything.
    this.cursor = (this.cursor + delta + count) % count;
    this.paint();
  }

  async toggle() {
    return this.open ? this.hide() : this.show();
  }

  async show() {
    if (this.open) return;
    this.open = true;

    /*
     * Built before the animation is asked for, not during it.
     *
     * `render` lays out every row, and doing that in the same task that starts
     * the transition leaves the main thread busy through its first frames — the
     * blur then appears to hang and then jump, which is exactly what it looked
     * like. Filling the panel while it is still hidden means the only thing
     * left to do when the class lands is composite.
     */
    this.input.value = "";
    this.cursor = 0;
    this.render();

    this.element.classList.add("is-open");
    this.input.focus();

    void this.fetchRepos();
  }

  async hide() {
    if (!this.open) return;
    this.open = false;
    this.element.classList.remove("is-open");
  }

  /** The repositories, once somebody has opened the launcher at least once. */
  private async fetchRepos() {
    if (this.askedForRepos) return;
    this.askedForRepos = true;
    try {
      const result = await loadRepos();
      this.repos = result.repos;
      // Only redraw if it is still up; the answer is kept either way.
      if (this.open) this.render();
    } catch {
      // Searching projects is a bonus. Everything else still works without it,
      // and an error here would be a dialog over a search box.
    }
  }

  /**
   * Put the answer on the clipboard.
   *
   * `navigator.clipboard` needs a secure context and a permission that can be
   * refused, so the older selection route is kept for when it is not there —
   * copying a number should not depend on how the page was served.
   */
  private async copy(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch {
      // Falls through to the older route below.
    }

    const carrier = document.createElement("textarea");
    carrier.value = text;
    carrier.setAttribute("aria-hidden", "true");
    carrier.style.cssText = "position:fixed;top:-9999px;opacity:0";
    document.body.appendChild(carrier);
    carrier.select();
    try {
      document.execCommand("copy");
    } catch {
      // Nothing left to try, and a dialog about a failed copy is worse than a
      // copy that quietly did not happen.
    }
    carrier.remove();
  }

  private choose(result?: Result) {
    if (!result) return;
    void this.hide();
    result.run();
  }

  private render() {
    this.results = search(this.input.value, {
      apps: APPS,
      windows: windowManager.list(),
      repos: this.repos,
      actions: this.buildActions(),
      openApp: (app: App) => openAppWindow(app, this.desktop),
      showWindow: (open) => {
        if (open.minimized) void open.window.restore();
        else open.window.onActive(open.window);
      },
      openRepo: (repo) => this.actions.openProjects(repo),
      copy: (text) => void this.copy(text),
      /*
       * A tab, because there is no alternative. Both DuckDuckGo and Google
       * refuse to be framed — DuckDuckGo says so outright, with
       * `frame-ancestors 'self' https://html.duckduckgo.com` — so a search
       * cannot open as a window on this desktop however much one would prefer
       * it to. `noopener` keeps the opened page from reaching back through
       * `window.opener` and navigating this one somewhere else.
       */
      searchWeb: (query) => {
        window.open(
          SEARCH_URL + encodeURIComponent(query),
          "_blank",
          "noopener,noreferrer"
        );
      }
    });

    if (this.cursor >= this.results.length) this.cursor = 0;
    this.paint();
  }

  private buildActions() {
    return [
      {
        id: "theme",
        name: "Switch theme",
        sub: "light and dark",
        run: () => this.actions.toggleTheme()
      },
      {
        id: "show-all",
        name: "Show all windows",
        run: () => this.actions.showAll()
      },
      {
        id: "minimize-all",
        name: "Minimise all windows",
        run: () => this.actions.minimizeAll()
      },
      {
        id: "settings",
        name: "Settings",
        sub: "wallpaper, accent, motion",
        run: () => this.actions.settings()
      },
      {
        id: "projects",
        name: "Open Projects",
        sub: "every repository",
        run: () => this.actions.openProjects()
      }
    ];
  }

  /** Draw the current results and highlight. */
  private paint() {
    this.list.textContent = "";

    if (!this.results.length) {
      const query = this.input.value.trim();
      this.empty.textContent = query
        ? `Nothing matches “${query}”.`
        : "Nothing to show.";
      this.empty.classList.add("is-shown");
      this.input.removeAttribute("aria-activedescendant");
      return;
    }
    this.empty.classList.remove("is-shown");

    let lastGroup: Group | undefined;
    this.results.forEach((result, i) => {
      if (result.group !== lastGroup) {
        lastGroup = result.group;
        const label = document.createElement("li");
        label.className = "launcher-group";
        label.setAttribute("role", "presentation");
        label.appendChild(document.createTextNode(result.group));
        this.list.appendChild(label);
      }

      const row = document.createElement("li");
      row.className = "launcher-row" + (i === this.cursor ? " is-active" : "");
      row.id = `launcher-result-${i}`;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", String(i === this.cursor));

      row.appendChild(result.app ? appIconFor(result.app) : glyphFor(result.group));

      const text = document.createElement("span");
      text.className = "launcher-text";
      const name = document.createElement("span");
      name.className = "launcher-name";
      name.appendChild(document.createTextNode(result.name));
      text.appendChild(name);
      if (result.sub) {
        const sub = document.createElement("span");
        sub.className = "launcher-sub";
        sub.appendChild(document.createTextNode(result.sub));
        text.appendChild(sub);
      }
      row.appendChild(text);

      if (result.badge) {
        const badge = document.createElement("span");
        badge.className = "launcher-badge";
        badge.appendChild(document.createTextNode(result.badge));
        row.appendChild(badge);
      }

      // Pressed rather than clicked, so the choice happens before the panel
      // loses focus and takes the row out from under the pointer.
      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.choose(result);
      });

      this.list.appendChild(row);
    });

    const active = this.list.querySelector<HTMLElement>(".launcher-row.is-active");
    if (active) {
      this.input.setAttribute("aria-activedescendant", active.id);
      // Guarded the way the motion layer guards the Web Animations API: not
      // every environment this renders in has it, and keeping the highlight in
      // view is a courtesy — not a reason to throw out of a render.
      if (typeof active.scrollIntoView === "function") {
        active.scrollIntoView({ block: "nearest" });
      }
    }
  }
}

function appIconFor(app: App): HTMLElement {
  const icon = appIcon(app, 25);
  // The launcher lays its own rows out; the menu's gutter would double it.
  icon.style.margin = "0";
  return icon;
}

const GLYPHS: Record<Group, string> = {
  Answer: "=",
  Apps: "▣",
  Windows: "▢",
  Projects: "◇",
  Actions: "◐",
  Web: "↗"
};

function glyphFor(group: Group): HTMLElement {
  const glyph = document.createElement("span");
  glyph.className = "launcher-glyph";
  glyph.setAttribute("aria-hidden", "true");
  glyph.appendChild(document.createTextNode(GLYPHS[group]));
  return glyph;
}

function hint(key: string, label: string): HTMLElement {
  const wrap = document.createElement("span");
  const b = document.createElement("b");
  b.appendChild(document.createTextNode(key));
  wrap.appendChild(b);
  wrap.appendChild(document.createTextNode(` ${label}`));
  return wrap;
}

export default Launcher;
