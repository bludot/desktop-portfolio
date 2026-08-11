import OSElement from "../../utils/OSElement";
import {
  color,
  font,
  radius,
  shadow,
  size,
  tracking,
  weight
} from "../../theme";
import { icon, type IconName } from "../../components/Icon";
import SwitchToggle from "../../components/SwitchToggle";
import { notify } from "../../notifications";
import { motion } from "../../utils/motion";

/**
 * Everything this desktop is made of, in one window.
 *
 * Two jobs, and the second is the one that justifies it. The first is the
 * obvious one: somewhere to see the icons, the type scale and the colours
 * beside each other, because a design system nobody can look at drifts.
 *
 * The second is that some of this desktop is otherwise almost impossible to
 * exercise. A notification appears when a visitor has opened the repositories
 * twice, twenty-five seconds in, and at most twice a visit — reasonable rules
 * for a visitor and miserable ones for anybody trying to see whether the card
 * still looks right. The alternative was pasting module imports into a console,
 * which in a dev server quietly hands back a *second* copy of the module and a
 * bus nobody is listening to. Buttons here run inside the desktop, on the same
 * instance as everything else, which is the only place the real thing happens.
 *
 * It is deliberately plain. A gallery that is more designed than the things in
 * it is showing you the gallery.
 */

const ICONS: IconName[] = [
  "about",
  "experience",
  "projects",
  "contact",
  "settings",
  "debugger",
  "flags",
  "search",
  "logout",
  "chat",
  "windows"
];

/** The colours worth seeing side by side. Surfaces first, then ink. */
const SWATCHES: Array<{ name: string; value: string; over?: boolean }> = [
  { name: "glassWindow", value: color.glassWindow },
  { name: "glassWindowRest", value: color.glassWindowRest },
  { name: "chromeSolid", value: color.chromeSolid },
  { name: "chromeRaised", value: color.chromeRaised },
  { name: "accent", value: color.accent },
  { name: "ink", value: color.ink, over: true },
  { name: "inkSoft", value: color.inkSoft, over: true },
  { name: "inkFaint", value: color.inkFaint, over: true }
];

const TYPE: Array<{ name: string; px: string }> = [
  { name: "display", px: size.display },
  { name: "heading", px: size.heading },
  { name: "body", px: size.body },
  { name: "bodyTight", px: size.bodyTight },
  { name: "small", px: size.small },
  { name: "caption", px: size.caption },
  { name: "micro", px: size.micro }
];

class PlaygroundContent extends OSElement {
  private box!: HTMLElement;

  constructor() {
    super("playgroundcontent", "playground-content");

    this.style = () => ({
      [this.id]: {
        height: "100%",
        overflow: "auto",
        color: color.ink,
        fontFamily: font.ui,
        fontSize: size.bodyTight,
        padding: "4px 0 22px",

        "& .pg-section": {
          padding: "16px 21px",
          borderBottom: `1px solid ${color.lineSoft}`
        },
        "& .pg-section:last-child": { borderBottom: "0" },

        "& .pg-title": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.inkFaint,
          margin: "0 0 4px"
        },
        "& .pg-why": {
          color: color.inkSoft,
          margin: "0 0 13px",
          lineHeight: 1.45,
          maxWidth: "58ch"
        },

        "& .pg-row": { display: "flex", flexWrap: "wrap", gap: "8px" },

        "& .pg-btn": {
          border: `1px solid ${color.lineSoft}`,
          background: "transparent",
          borderRadius: radius.control,
          color: color.ink,
          font: "inherit",
          fontWeight: weight.emphasise,
          padding: "6px 12px",
          cursor: "pointer",
          transition: "background 150ms ease"
        },
        "& .pg-btn:hover": { background: color.hover },

        // ------------------------------------------------------- icons
        "& .pg-icons": {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))",
          gap: "8px"
        },
        "& .pg-icon": {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "7px",
          padding: "11px 4px",
          borderRadius: radius.control,
          background: color.chromeRaised
        },
        "& .pg-icon svg": { width: "19px", height: "19px" },
        "& .pg-icon span": {
          fontFamily: font.mono,
          fontSize: "9.5px",
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },

        // ------------------------------------------------------ colour
        "& .pg-swatches": {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
          gap: "8px"
        },
        "& .pg-swatch": {
          borderRadius: radius.control,
          border: `1px solid ${color.lineSoft}`,
          overflow: "hidden"
        },
        "& .pg-chip": { height: "42px" },
        "& .pg-swatch span": {
          display: "block",
          padding: "6px 8px",
          fontFamily: font.mono,
          fontSize: "9.5px",
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },

        // -------------------------------------------------------- type
        "& .pg-type": { display: "flex", flexDirection: "column", gap: "9px" },
        "& .pg-line": { display: "flex", alignItems: "baseline", gap: "12px" },
        "& .pg-line b": {
          fontFamily: font.mono,
          fontSize: "9.5px",
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          fontWeight: weight.read,
          flex: "0 0 72px"
        },

        // ------------------------------------------------------ motion
        "& .pg-stage": {
          marginTop: "11px",
          height: "74px",
          display: "grid",
          placeItems: "center",
          borderRadius: radius.control,
          border: `1px dashed ${color.line}`
        },
        "& .pg-box": {
          width: "58px",
          height: "38px",
          borderRadius: radius.control,
          background: color.chromeRaised,
          boxShadow: shadow.windowRest
        },

        "& .pg-switch": { display: "flex", alignItems: "center", gap: "11px" }
      }
    });
  }

  private section(title: string, why: string): HTMLElement {
    const section = document.createElement("section");
    section.className = "pg-section";
    const head = document.createElement("p");
    head.className = "pg-title";
    head.appendChild(document.createTextNode(title));
    const note = document.createElement("p");
    note.className = "pg-why";
    note.appendChild(document.createTextNode(why));
    section.append(head, note);
    this.element.appendChild(section);
    return section;
  }

  private button(label: string, run: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pg-btn";
    button.appendChild(document.createTextNode(label));
    button.addEventListener("click", run);
    return button;
  }

  async beforeLoad() {
    this.notifications();
    this.icons();
    this.colours();
    this.type();
    this.controls();
    this.motion();
  }

  /*
   * The section this window exists for. Every one of these goes through
   * `notify`, the same call any part of the desktop would make — nothing here
   * reaches into the toast component, so what appears is what a visitor gets.
   */
  private notifications() {
    const section = this.section(
      "Notifications",
      "Posted through the same bus anything else on this desktop uses. Three at once is the ceiling; a fourth pushes the oldest out."
    );
    const row = document.createElement("div");
    row.className = "pg-row";

    row.appendChild(
      this.button("One", () =>
        notify({
          sender: "Launcher",
          glyph: "search",
          title: "Searching is faster",
          text: "Find any repository by name, without scrolling the list.",
          action: { label: "Open it", run: () => {} }
        })
      )
    );

    row.appendChild(
      this.button("Without an action", () =>
        notify({
          sender: "Projects",
          glyph: "projects",
          title: "GitHub is not answering",
          text: "Showing what was cached an hour ago."
        })
      )
    );

    row.appendChild(
      this.button("Four, to see the cap", () => {
        const four: Array<[IconName, string, string]> = [
          ["projects", "First", "This one is pushed out by the fourth."],
          ["chat", "Second", "The model finished loading."],
          ["settings", "Third", "Appearance changed to dark."],
          ["search", "Fourth", "Only three may be on screen at once."]
        ];
        four.forEach(([glyph, title, text], at) => {
          setTimeout(
            () => notify({ sender: "Playground", glyph, title, text }),
            at * 260
          );
        });
      })
    );

    row.appendChild(
      this.button("One that withdraws itself", () =>
        notify({
          sender: "Playground",
          glyph: "debugger",
          title: "This one leaves early",
          text: "Withdrawn after two seconds, the way a stale message would be.",
          onShown: (dismiss) => setTimeout(dismiss, 2_000)
        })
      )
    );

    section.appendChild(row);
  }

  private icons() {
    const section = this.section(
      "Icons",
      "One stroked set, drawn rather than fetched. The GitHub mark is the exception and is filled, because a logo is not ours to restyle."
    );
    const grid = document.createElement("div");
    grid.className = "pg-icons";
    ICONS.forEach((name) => {
      const cell = document.createElement("div");
      cell.className = "pg-icon";
      cell.appendChild(icon(name));
      const label = document.createElement("span");
      label.appendChild(document.createTextNode(name));
      cell.appendChild(label);
      grid.appendChild(cell);
    });
    section.appendChild(grid);
  }

  private colours() {
    const section = this.section(
      "Colour",
      "Every surface is translucent and every one of these resolves differently in the other theme. Switch appearance in Settings and watch them move."
    );
    const grid = document.createElement("div");
    grid.className = "pg-swatches";
    SWATCHES.forEach(({ name, value, over }) => {
      const swatch = document.createElement("div");
      swatch.className = "pg-swatch";
      const chip = document.createElement("div");
      chip.className = "pg-chip";
      // Ink colours are shown as a bar of the ink itself; surfaces as the fill.
      chip.style.background = value;
      if (over) chip.style.opacity = "0.9";
      const label = document.createElement("span");
      label.appendChild(document.createTextNode(name));
      swatch.append(chip, label);
      grid.appendChild(swatch);
    });
    section.appendChild(grid);
  }

  private type() {
    const section = this.section(
      "Type",
      "Seven sizes, and a mono face for anything that is data rather than prose — dates, counts, labels, the meta line on a titlebar."
    );
    const list = document.createElement("div");
    list.className = "pg-type";
    TYPE.forEach(({ name, px }) => {
      const line = document.createElement("div");
      line.className = "pg-line";
      const key = document.createElement("b");
      key.appendChild(document.createTextNode(`${name} ${px}`));
      const sample = document.createElement("span");
      sample.style.fontSize = px;
      sample.appendChild(document.createTextNode("Portfolio OS"));
      line.append(key, sample);
      list.appendChild(line);
    });
    section.appendChild(list);
  }

  private controls() {
    const section = this.section(
      "Controls",
      "The switch is the one the feature flags use. Everything else on this desktop is a button with a border and a hover."
    );
    const row = document.createElement("div");
    row.className = "pg-switch";

    const toggle = new SwitchToggle(10, undefined, undefined, false);
    const holder = document.createElement("div");
    toggle.load(holder);
    const state = document.createElement("span");
    state.style.color = color.inkFaint;
    state.appendChild(document.createTextNode("off"));
    toggle.setOnClick(function (this: SwitchToggle) {
      const on = this.element.querySelector<HTMLInputElement>(
        "input[type=checkbox]"
      )!.checked;
      state.textContent = on ? "on" : "off";
    });

    row.append(holder, state);
    section.appendChild(row);
  }

  private motion() {
    const section = this.section(
      "Motion",
      "Entrances are slower than exits: arriving should feel considered, leaving should get out of the way. Both respect a reduced-motion preference and become instant."
    );
    const row = document.createElement("div");
    row.className = "pg-row";
    row.appendChild(this.button("Enter", () => void motion.popIn(this.box)));
    row.appendChild(this.button("Exit", () => void this.exit()));
    section.appendChild(row);

    const stage = document.createElement("div");
    stage.className = "pg-stage";
    this.box = document.createElement("div");
    this.box.className = "pg-box";
    stage.appendChild(this.box);
    section.appendChild(stage);
  }

  /** Play the exit, then put it back, so the button can be pressed twice. */
  private async exit() {
    await motion.popOut(this.box);
    // The exit fills forwards; without this the box never comes back.
    motion.clearAnimations(this.box);
  }
}

export default PlaygroundContent;
