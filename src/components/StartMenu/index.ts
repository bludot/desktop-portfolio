import OSElement from "../../utils/OSElement";
import { APPS, openAppWindow, type App } from "../../apps/external";
import { appMark } from "../AppIcon";
import { icon, type IconName } from "../Icon";
import {
  blur as blurFx,
  color,
  font,
  radius,
  shadow,
  size,
  tracking,
  weight
} from "../../theme";
import { overlayScroll } from "../Scrollbar";
import windowManager from "../../utils/windowManager";
import Desktop from "../Desktop";
import AboutContent from "./../../contents/about";
import ExperienceContent from "../../contents/experience";
import ProjectsContent from "../../contents/projects";
import AlertContent from "../../contents/alert";
import LoggerWindow from "../../contents/logger";
import FeatureFlagsApp from "../../apps/FeatureFlags";
import SettingsApp from "../../apps/Settings";
import { NARROW_PX } from "../../utils/utils";

/**
 * Everything this desktop can open, as one board.
 *
 * It used to be a column of eleven rows, 36px tall with 10px margins — about
 * 716px of panel, anchored 75px off the floor, with no ceiling and no way to
 * scroll. On a phone that put the top of it, which is to say James's own name
 * and the first two destinations, above the edge of the screen and out of
 * reach. Growing upward from the taskbar meant the overflow came off the end
 * you would look at first.
 *
 * So: tiles rather than rows. Four columns hold seven destinations in the room
 * five rows used to take, which is what makes it fit rather than any clever
 * bounding — the cap below is a backstop, not the mechanism.
 *
 * One component, three widths:
 *
 *   - A phone gets the whole screen above the taskbar. There is no reason to
 *     float a 344px panel in the corner of a 390pt display and leave the rest
 *     of it showing wallpaper.
 *   - A tablet gets what a desktop gets: at this width a pointer or a thumb
 *     both work, and an anchored panel keeps the desktop behind it visible,
 *     which is the point of a desktop.
 *   - A desktop gets the panel above the button that opened it.
 *
 * Nothing here branches on a user agent, and there is no second layout — one
 * stylesheet, one media query, the same DOM either way.
 */

/** Where the panel stops floating and takes the screen. Shared with `isNarrow`. */
const FULLSCREEN_PX = NARROW_PX;

/**
 * What to assume the taskbar takes when it cannot be measured.
 *
 * It is measured on every open — see `floor()` — because the real answer is not
 * its height. The bar floats: 50px tall with a 15px margin on a desktop, and
 * flush with no margin on a phone. Hardcoding the height alone put this panel
 * seven pixels underneath it, where the bar's own z-index drew over the corner.
 */
const TASKBAR_PX = 50;
const TASKBAR_MARGIN_PX = 15;

/** The breath between the board and the bar it sits above. */
const GAP_PX = 8;

interface Destination {
  /** The window title, which is also how an open one is recognised. */
  title: string;
  label: string;
  /** One line under the label, where there is room for it. */
  meta?: string;
  glyph?: IconName;
  app?: App;
  open: () => void;
}

class StartMenu extends OSElement {
  isMobile: boolean;
  /** Told to put the menu away, since the menu does not own whether it is up. */
  private readonly dismiss: () => void;
  private body!: HTMLElement;
  private scrollbar?: { unload: () => Promise<void> | void };
  private subscription?: { unsubscribe: () => void };

  constructor(private readonly desktop: Desktop, dismiss: () => void = () => undefined) {
    super("startmenu", "start-menu");
    this.dismiss = dismiss;
    this.isMobile = false;
    // Reset on every load, so reopening does not keep appending the generated
    // class to a className that only ever grows.
    this.className = "start-menu";

    this.style = () => ({
      [this.id]: {
        position: "fixed",
        left: "15px",
        /*
         * Measured, not assumed — `--taskbar-floor` is written on the element
         * every time the board opens, and is how much room the bar actually
         * takes including the margin it floats on.
         */
        bottom: `calc(var(--taskbar-floor, ${TASKBAR_PX + TASKBAR_MARGIN_PX}px) + ${GAP_PX}px)`,
        width: "344px",
        /*
         * A ceiling, in `dvh` rather than `vh`.
         *
         * `vh` is the *taller* of the two viewports a mobile browser has — the
         * one with the URL bar hidden — so a panel capped in `vh` is still
         * taller than the screen it is on for as long as that bar is showing.
         * This should never engage now that the board fits; it is here so the
         * old bug cannot come back by way of a fourth destination.
         */
        maxHeight: `calc(100dvh - var(--taskbar-floor, ${TASKBAR_PX + TASKBAR_MARGIN_PX}px) - 32px)`,
        boxSizing: "border-box",
        display: "flex",
        flexFlow: "column nowrap",
        zIndex: "999",
        overflow: "hidden",
        borderRadius: radius.window,
        background: color.chrome,
        backdropFilter: blurFx.chrome,
        WebkitBackdropFilter: blurFx.chrome,
        boxShadow: `${shadow.chrome}, ${shadow.edge}`,
        color: color.ink,
        fontFamily: font.ui,

        // --------------------------------------------------------- who
        "& .start-id": {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 13px 11px",
          flex: "0 0 auto"
        },
        "& .start-face": {
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          flex: "0 0 auto",
          background: "linear-gradient(150deg, #d8b4c4, #a87d97)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.5)"
        },
        "& .start-who": {
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          minWidth: 0
        },
        "& .start-name": {
          fontSize: size.body,
          fontWeight: weight.announce,
          letterSpacing: tracking.heading,
          lineHeight: 1.15
        },
        "& .start-status": {
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },
        /*
         * The taskbar's availability pip, exactly. `--current` is the token for
         * "this is happening now", and it is the same fact in both places.
         */
        "& .start-pip": {
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          flex: "0 0 auto",
          background: color.current,
          boxShadow: `0 0 0 3px rgba(74,124,89,.16)`
        },
        "& .start-search": {
          marginLeft: "auto",
          flex: "0 0 auto",
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          height: "28px",
          padding: "0 10px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.pill,
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.caption,
          cursor: "pointer",
          transition: "background 150ms ease, color 150ms ease"
        },
        "& .start-search:hover": { background: color.hover, color: color.ink },
        "& .start-search svg": { width: "13px", height: "13px" },
        "& .start-key": {
          fontFamily: font.mono,
          fontSize: size.micro,
          color: color.inkFaint
        },

        "& .start-divider": {
          height: "1px",
          flex: "0 0 auto",
          background: color.lineSoft
        },

        // ------------------------------------------------------ the grid
        "& .start-body": {
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "auto",
          position: "relative"
        },
        "& .start-group": {
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          padding: "13px 15px 7px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.inkFaint
        },
        "& .start-count": { fontVariantNumeric: "tabular-nums", opacity: .75 },
        "& .start-grid": {
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "2px",
          padding: "0 9px"
        },

        "& .start-cell": {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          padding: "10px 4px 11px",
          border: "0",
          background: "transparent",
          borderRadius: radius.control,
          color: "inherit",
          font: "inherit",
          textAlign: "center",
          cursor: "pointer",
          transition: "background 150ms ease"
        },
        "& .start-cell:hover": { background: color.hover },
        // The one accent use on this surface.
        "& .start-cell:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "-2px"
        },

        /*
         * Flat, like every other control here: one fill, one radius, and the
         * radius is whichever the viewer chose in Settings. No gradient, no
         * inner highlight, no shadow — a window earns a shadow by floating,
         * a plate sitting on a panel does not.
         */
        "& .start-plate": {
          position: "relative",
          width: "46px",
          height: "46px",
          flex: "0 0 auto",
          display: "grid",
          placeItems: "center",
          borderRadius: radius.control,
          background: color.chromeRaised,
          color: color.ink
        },
        "& .start-plate svg": { width: "22px", height: "22px" },
        // An app's favicon is its own; it keeps its colour and its edges.
        "& .start-plate .app-icon": { width: "26px", height: "26px" },
        "& .start-plate .app-icon img": { width: "26px", height: "26px" },

        /*
         * There is deliberately no badge on a tile.
         *
         * A dot in the corner of an icon is the notification affordance, and
         * spending it on "this window is already open" would leave nothing to
         * say with when something actually wants attention. The taskbar lists
         * what is running, which is the surface for that; pressing a tile still
         * goes back to an open window rather than building a second one, it
         * simply does not announce it beforehand.
         */
        "& .start-label": {
          fontSize: size.caption,
          fontWeight: weight.emphasise,
          color: color.ink,
          lineHeight: 1.25,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },
        "& .start-meta": {
          marginTop: "-4px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          lineHeight: 1.2,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },

        // --------------------------------------------------- the switches
        /*
         * Not tiles. A tile promises a place you go, and these three are
         * switches — one opens a settings window, one a log, one a list of
         * flags. Having them here also ends the mobile-only feature-flags row:
         * there is room for the pill at every width.
         */
        "& .start-utility": {
          flex: "0 0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          padding: "11px 13px 13px",
          marginTop: "6px",
          borderTop: `1px solid ${color.lineSoft}`
        },
        "& .start-pill": {
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          height: "28px",
          padding: "0 11px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.pill,
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.caption,
          whiteSpace: "nowrap",
          cursor: "pointer",
          transition: "background 150ms ease, color 150ms ease"
        },
        "& .start-pill:hover": { background: color.hover, color: color.ink },
        "& .start-pill:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        "& .start-pill svg": { width: "13px", height: "13px" },

        // -------------------------------------------------------- a phone
        /*
         * Width, not user agent — a narrow browser window has the same problem
         * a phone does. Above the taskbar rather than over it: the button that
         * opened this is down there, and it is the way back out.
         */
        [`@media (max-width: ${FULLSCREEN_PX}px)`]: {
          left: "0",
          right: "0",
          top: "0",
          // Flush with the bar rather than floating above it: the bar loses its
          // margin at this width, and the board takes everything over it.
          bottom: `var(--taskbar-floor, ${TASKBAR_PX}px)`,
          width: "auto",
          maxHeight: "none",
          borderRadius: "0",
          paddingTop: "env(safe-area-inset-top)",

          "& .start-id": { padding: "16px 16px 14px" },
          "& .start-face": { width: "34px", height: "34px" },
          "& .start-name": { fontSize: size.heading },
          "& .start-search": {
            height: "40px",
            padding: "0 14px",
            fontSize: size.small
          },
          "& .start-search svg": { width: "15px", height: "15px" },
          "& .start-grid": { gap: "4px", padding: "0 10px" },
          "& .start-cell": { padding: "12px 4px 13px", gap: "9px" },
          "& .start-plate": { width: "54px", height: "54px" },
          "& .start-plate svg": { width: "25px", height: "25px" },
          "& .start-plate .app-icon, & .start-plate .app-icon img": {
            width: "30px",
            height: "30px"
          },
          "& .start-label": { fontSize: size.small },
          // The second line is dropped rather than wrapped: there is width for
          // four columns or for a host name, not for both.
          "& .start-meta": { display: "none" },
          "& .start-utility": {
            padding: "12px 14px",
            paddingBottom: "calc(13px + env(safe-area-inset-bottom))"
          },
          "& .start-pill": { height: "40px", padding: "0 14px", fontSize: size.small },
          "& .start-pill svg": { width: "15px", height: "15px" }
        }
      }
    });
  }

  /** Everything with a window behind it, in the order they are worth reading. */
  private destinations(): Destination[] {
    return [
      {
        title: "About",
        label: "About",
        glyph: "about",
        open: () =>
          windowManager.new({
            title: "About",
            content: new AboutContent(),
            desktop: this.desktop,
            dimensions: { width: 330, height: 430 }
          })
      },
      {
        title: "Experience",
        label: "Experience",
        meta: "8 roles",
        glyph: "experience",
        open: () =>
          windowManager.new({
            title: "Experience",
            meta: "8 roles · 2012-2026",
            content: new ExperienceContent(),
            desktop: this.desktop,
            dimensions: { width: 588, height: 470 }
          })
      },
      {
        title: "Projects",
        label: "Projects",
        meta: "github",
        glyph: "projects",
        open: () =>
          windowManager.new({
            title: "Projects",
            meta: "github",
            content: new ProjectsContent(),
            desktop: this.desktop,
            dimensions: { width: 760, height: 620 }
          })
      },
      {
        title: "Contact Unavailable",
        label: "Contact",
        meta: "soon",
        glyph: "contact",
        open: () =>
          windowManager.new({
            title: "Contact Unavailable",
            content: new AlertContent({
              title: "Contact Unavailable",
              text: "This window isnt built yet, come back later"
            }),
            dimensions: { width: 250, height: 180 },
            desktop: this.desktop,
            isDialog: true
          })
      }
    ];
  }

  /**
   * The three that live somewhere else.
   *
   * No host under the name, though there is room for one: a tile is about
   * 78px wide, which holds nine characters of mono, and two of the three hosts
   * are longer than that — so the line would be an ellipsis more often than a
   * fact. The host is on the window's own titlebar and in the launcher, where
   * it has the width to be read.
   */
  private apps(): Destination[] {
    return APPS.map((app) => ({
      title: app.name,
      label: app.name,
      app,
      open: () => openAppWindow(app, this.desktop)
    }));
  }

  /**
   * Go there — or go back, when it is already open.
   *
   * A minimised window is restored and a background one raised, rather than a
   * second copy being built. Half of what a start menu gets pressed for is
   * returning to something that already exists, and no version of this menu
   * has said so before.
   */
  private choose(destination: Destination) {
    const already = windowManager
      .list()
      .find((open) => open.title === destination.title);

    if (already) {
      if (already.minimized) {
        void already.window.restore();
      } else {
        already.window.onActive(already.window);
      }
    } else {
      destination.open();
    }

    // Whatever was pressed, the menu has done its job.
    this.dismiss();
  }

  private cell(destination: Destination): HTMLElement {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "start-cell";

    const plate = document.createElement("span");
    plate.className = "start-plate";
    if (destination.app) {
      plate.appendChild(appMark(destination.app, 26));
    } else if (destination.glyph) {
      plate.appendChild(icon(destination.glyph));
    }
    cell.appendChild(plate);

    const label = document.createElement("span");
    label.className = "start-label";
    label.appendChild(document.createTextNode(destination.label));
    cell.appendChild(label);

    if (destination.meta) {
      const line = document.createElement("span");
      line.className = "start-meta";
      line.appendChild(document.createTextNode(destination.meta));
      cell.appendChild(line);
    }

    cell.addEventListener("click", () => this.choose(destination));
    return cell;
  }

  private group(title: string, note: string | undefined): HTMLElement {
    const head = document.createElement("p");
    head.className = "start-group";
    head.appendChild(document.createTextNode(title));
    if (note) {
      const count = document.createElement("span");
      count.className = "start-count";
      count.appendChild(document.createTextNode(note));
      head.appendChild(count);
    }
    return head;
  }

  private grid(destinations: Destination[]): HTMLElement {
    const grid = document.createElement("div");
    grid.className = "start-grid";
    destinations.forEach((destination) =>
      grid.appendChild(this.cell(destination))
    );
    return grid;
  }

  private pill(
    label: string,
    glyph: IconName | undefined,
    action: () => void
  ): HTMLElement {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "start-pill";
    if (glyph) pill.appendChild(icon(glyph));
    pill.appendChild(document.createTextNode(label));
    pill.addEventListener("click", () => {
      action();
      this.dismiss();
    });
    return pill;
  }

  /**
   * Draw the board.
   *
   * Rebuilt on every open rather than kept in sync: the menu is short-lived,
   * and a fresh build is cheaper to reason about than a diff.
   */
  private render() {
    this.element.textContent = "";

    // ------------------------------------------------------------- who
    const id = document.createElement("div");
    id.className = "start-id";

    const face = document.createElement("span");
    face.className = "start-face";
    face.setAttribute("aria-hidden", "true");
    id.appendChild(face);

    const who = document.createElement("div");
    who.className = "start-who";

    const name = document.createElement("p");
    name.className = "start-name";
    name.appendChild(document.createTextNode("James"));
    who.appendChild(name);

    const status = document.createElement("p");
    status.className = "start-status";
    const pip = document.createElement("span");
    pip.className = "start-pip";
    pip.setAttribute("aria-hidden", "true");
    status.appendChild(pip);
    /*
     * What James is, not what the desktop is doing. The taskbar is where what
     * is running belongs, and it already says it — a count here was a second
     * answer to a question this panel was not being asked.
     */
    status.appendChild(document.createTextNode("available for work"));
    who.appendChild(status);
    id.appendChild(who);

    const search = document.createElement("button");
    search.type = "button";
    search.className = "start-search";
    search.appendChild(icon("search"));
    search.appendChild(document.createTextNode("Search"));
    const key = document.createElement("span");
    key.className = "start-key";
    // One token, not two: ⌘K is read as a single key.
    key.appendChild(document.createTextNode("⌘K"));
    search.appendChild(key);
    // The launcher is the search surface; this menu never grows a second field.
    search.addEventListener("click", () => {
      this.dismiss();
      void this.desktop.launcher?.toggle();
    });
    id.appendChild(search);

    this.element.appendChild(id);

    const divider = document.createElement("div");
    divider.className = "start-divider";
    this.element.appendChild(divider);

    // ------------------------------------------------------- the tiles
    const body = document.createElement("div");
    body.className = "start-body";

    const destinations = this.destinations();
    body.appendChild(this.group("Windows", `· ${destinations.length}`));
    body.appendChild(this.grid(destinations));

    body.appendChild(this.group("Apps", "· elsewhere"));
    body.appendChild(this.grid(this.apps()));

    this.element.appendChild(body);
    this.body = body;

    // ---------------------------------------------------- the switches
    const utility = document.createElement("div");
    utility.className = "start-utility";
    utility.appendChild(
      this.pill("Settings", "settings", () => {
        new SettingsApp(this.desktop).load();
      })
    );
    utility.appendChild(
      this.pill("Debugger", "debugger", () => {
        windowManager.new({
          title: "Debugger",
          content: new LoggerWindow(),
          dimensions: { width: 800, height: 400 },
          desktop: this.desktop
        });
      })
    );
    utility.appendChild(
      this.pill("Feature flags", "flags", () => {
        new FeatureFlagsApp(this.desktop).load();
      })
    );
    this.element.appendChild(utility);
  }

  /*
   * Awaited, which it was not.
   *
   * Without the await this resolved before the base class had finished, so a
   * load that failed — no #app to mount into, an element still carrying a
   * parent — rejected into nothing and the caller was told it had succeeded.
   * The launcher then believed a menu was open that had never appeared, which
   * is why it took two presses to get one: the next press closed the menu that
   * was not there.
   */
  /**
   * How much room the taskbar takes at the bottom of the screen.
   *
   * Not its height: the bar floats on a 15px margin at desktop widths and sits
   * flush on a phone, so "50px" is wrong by exactly the margin — which is how
   * this panel came to sit seven pixels underneath it, behind a bar whose
   * z-index is higher. Measured on every open, since it is a different answer
   * at different widths and the board is built fresh each time anyway.
   */
  private floor(): number {
    const bar = this.desktop.getTaskbar?.().getElement();
    const rect = bar?.getBoundingClientRect();
    // Nothing to measure — detached, or no layout yet. Fall back to the bar at
    // its desktop size rather than to a number that would overlap something.
    if (!rect?.height) return TASKBAR_PX + TASKBAR_MARGIN_PX;
    return Math.max(0, window.innerHeight - rect.top);
  }

  async load(element: HTMLElement) {
    this.render();
    // Before the first paint, so the board never appears in the wrong place and
    // then corrects itself.
    this.element.style.setProperty("--taskbar-floor", `${this.floor()}px`);
    if (!this.parent) {
      await super.load(element);
    }

    /*
     * The desktop's own bar, on the one box in here that can scroll.
     *
     * It should never be needed — seven tiles and a utility row fit inside the
     * cap at every size this runs at — but a menu that cannot scroll is
     * precisely the fault this replaces, and the bar costs nothing while there
     * is nothing to scroll.
     */
    this.hangScrollbar();

    // A window closing while the board is up should take its mark with it.
    this.subscription = windowManager.subscribe(() => {
      if (!this.parent) return;
      this.render();
      this.hangScrollbar();
    });
  }

  /**
   * One bar, on whatever box the latest render produced.
   *
   * The old one is dropped first: a render throws its scroller away, and a bar
   * still listening to a node nobody can see is a leak with a scroll handler
   * on it.
   */
  private hangScrollbar() {
    void this.scrollbar?.unload();
    this.scrollbar = overlayScroll(this.body, "y", this.element);
  }

  async unload() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    await this.scrollbar?.unload();
    this.scrollbar = undefined;
    if (this.parent) await super.unload();
  }
}

export default StartMenu;
