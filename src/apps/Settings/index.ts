import App from "../App";
import OSElement from "../../utils/OSElement";
import windowManager from "../../utils/windowManager";
import Desktop from "../../components/Desktop";
import { centreOf, swapAppearance } from "../../utils/motion";
import appearance, {
  DEFAULT_APPEARANCE,
  type Appearance
} from "../../utils/appearance";
import {
  accentPalette,
  wallpapers,
  cornerStyles,
  CUSTOM_WALLPAPER
} from "../../theme";
import SwitchToggle from "../../components/SwitchToggle";
import {
  color,
  font,
  radius,
  size,
  space,
  tracking,
  weight
} from "../../theme";
import { saveSettings, clearSettings } from "../../Store";
import { observeWidth } from "../../utils/utils";

/** Below this the label cannot sit beside its control. */
const NARROW_CONTENT_PX = 380;

const THEME_CHOICES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" }
] as const;

class SettingsApp extends App {
  constructor(private readonly desktop: Desktop) {
    super("Settings");
  }

  load() {
    windowManager.new({
      title: this.name,
      meta: "Appearance",
      content: new SettingsContent(),
      desktop: this.desktop,
      dimensions: { width: 460, height: 520 }
    });
  }
}

/**
 * The settings window.
 *
 * Every control writes straight through — there is no Save button, because
 * every one of these is reversible and visible the instant it changes, so
 * asking someone to confirm a wallpaper would only add a step. Persistence
 * happens in the background; the desktop has already repainted by then.
 */
class SettingsContent extends OSElement {
  private stopObserving?: () => void;
  private subscription?: { unsubscribe: () => void };
  private body!: HTMLElement;
  private notice = "";

  constructor() {
    super("settingscontent", "settings-content");

    this.body = document.createElement("div");
    this.body.className = "settings-body";
    this.element.appendChild(this.body);

    this.style = () => ({
      [this.id]: {
        padding: `${space.windowPadY} ${space.windowPadX}`,
        display: "block",
        fontFamily: font.ui,
        color: color.ink,

        "& .settings-group": {
          margin: "0 0 20px"
        },
        "& .settings-legend": {
          margin: "0 0 11px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.inkFaint
        },
        // Label on the left, control on the right, hairline between rows.
        "& .settings-row": {
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "14px",
          alignItems: "center",
          padding: "10px 0",
          borderTop: `1px solid ${color.lineSoft}`
        },
        "& .settings-row:first-of-type": {
          borderTop: "0"
        },
        "& .settings-label": {
          margin: "0",
          fontSize: size.bodyTight,
          fontWeight: weight.emphasise
        },
        "& .settings-hint": {
          margin: "2px 0 0",
          fontSize: size.caption,
          lineHeight: 1.45,
          color: color.inkSoft
        },

        // A segmented control, not a dropdown: three options are quicker to
        // read side by side than hidden behind a click.
        "& .settings-segmented": {
          display: "inline-flex",
          padding: "2px",
          gap: "2px",
          borderRadius: radius.pill,
          background: color.chrome,
          boxShadow: `inset 0 0 0 1px ${color.lineSoft}`
        },
        "& .settings-segmented button": {
          border: "0",
          borderRadius: "6px",
          padding: "5px 11px",
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          cursor: "pointer",
          transition: "background-color 130ms ease, color 130ms ease"
        },
        "& .settings-segmented button:hover": {
          color: color.ink
        },
        "& .settings-segmented button[aria-pressed='true']": {
          background: color.chromeRaised,
          color: color.ink
        },
        "& .settings-segmented button:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },

        "& .settings-swatches": {
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "flex-end"
        },
        "& .settings-swatch": {
          width: "46px",
          height: "34px",
          padding: "0",
          border: "0",
          borderRadius: radius.control,
          cursor: "pointer",
          boxShadow: `inset 0 0 0 1px ${color.line}`,
          transition: "box-shadow 130ms ease, transform 130ms ease"
        },
        "& .settings-swatch:hover": {
          transform: "translateY(-1px)"
        },
        "& .settings-swatch[aria-pressed='true']": {
          boxShadow: `0 0 0 2px ${color.accent}`
        },
        "& .settings-swatch:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "2px"
        },
        // Round, and smaller: a colour, not a picture.
        "& .settings-swatch.is-accent": {
          width: "26px",
          height: "26px",
          borderRadius: "50%"
        },

        // A label wrapping a hidden file input: the native control cannot be
        // styled, and a bare "Choose file" button beside four swatches reads
        // as though it belongs to a form.
        "& .settings-upload": {
          display: "inline-flex",
          alignItems: "center",
          height: "34px",
          padding: "0 12px",
          borderRadius: radius.control,
          border: `1px dashed ${color.line}`,
          color: color.inkSoft,
          fontSize: size.small,
          fontWeight: weight.emphasise,
          cursor: "pointer"
        },
        "& .settings-upload:hover": {
          color: color.ink,
          background: color.hover
        },
        "& .settings-upload input": {
          display: "none"
        },
        "& .settings-notice": {
          flex: "1 1 100%",
          margin: "6px 0 0",
          fontSize: size.caption,
          lineHeight: 1.45,
          color: color.accent,
          textAlign: "right"
        },
        "& .settings-reset.is-inline": {
          height: "34px",
          padding: "0 10px"
        },
        "& .settings-reset": {
          border: `1px solid ${color.line}`,
          borderRadius: radius.control,
          padding: "6px 12px",
          background: "transparent",
          color: color.ink,
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          cursor: "pointer"
        },
        "& .settings-reset:hover": {
          background: color.chrome
        },
        "& .settings-reset:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },

        "&.is-narrow": {
          padding: "15px 14px",
          "& .settings-row": {
            gridTemplateColumns: "1fr",
            gap: "9px"
          },
          "& .settings-swatches": {
            justifyContent: "flex-start"
          }
        }
      }
    });

    this.render();
    // Redraw when something else changes appearance, so two open Settings
    // windows cannot disagree about what is selected.
    this.subscription = appearance.subscribe(() => this.render());
  }

  /**
   * Apply, animate and persist — the one path every control here goes through.
   *
   * `from` is the control that was pressed, when there is one: the change then
   * opens out of it rather than dissolving, which is worth having for a theme
   * or a wallpaper because those repaint the entire desktop at once.
   *
   * Both the change and the write happen inside the callback. It runs after the
   * old picture has been taken, so anything reading `appearance.get()` outside
   * it would be reading the state this is replacing.
   */
  private change(patch: Partial<Appearance>, from?: Element) {
    this.notice = "";
    swapAppearance(() => {
      appearance.set(patch);
      void saveSettings(appearance.get());
    }, from ? centreOf(from) : undefined);
  }

  /** The drawn skies, plus whatever has been uploaded, plus the upload. */
  private wallpaperControl(current: Appearance): HTMLElement {
    const options = Object.entries(wallpapers).map(([id, paper]) => ({
      id,
      label: paper.name,
      selected: current.wallpaper === id,
      background: paper[appearance.scheme()].sky
    }));

    if (current.customWallpaper) {
      options.push({
        id: CUSTOM_WALLPAPER,
        label: "Your picture",
        selected: current.wallpaper === CUSTOM_WALLPAPER,
        background: `url("${current.customWallpaper}") center / cover no-repeat`
      });
    }

    const element = swatches(options, (id, from) =>
      this.change({ wallpaper: id }, from)
    );
    element.appendChild(this.uploadButton());

    if (this.notice) {
      const notice = document.createElement("p");
      notice.className = "settings-notice";
      notice.setAttribute("role", "status");
      notice.appendChild(document.createTextNode(this.notice));
      element.appendChild(notice);
    }

    if (current.customWallpaper) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "settings-reset is-inline";
      remove.appendChild(document.createTextNode("Remove"));
      remove.addEventListener("click", () =>
        this.change({
          customWallpaper: undefined,
          // Falling back rather than leaving "custom" selected with nothing
          // behind it, which would show the default sky under the wrong label.
          wallpaper:
            current.wallpaper === CUSTOM_WALLPAPER
              ? DEFAULT_APPEARANCE.wallpaper
              : current.wallpaper
        })
      );
      element.appendChild(remove);
    }

    return element;
  }

  private uploadButton(): HTMLElement {
    const label = document.createElement("label");
    label.className = "settings-upload";
    label.appendChild(document.createTextNode("Upload"));

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      input.value = "";
      if (file) void this.useImage(file);
    });

    label.appendChild(input);
    return label;
  }

  /**
   * Read the picture and keep it as a data URL.
   *
   * It never leaves the browser: it is stored in this desktop's own database
   * and read back on boot, so nothing is uploaded anywhere. The cap is there
   * because the whole thing goes into IndexedDB as one string, and a photo
   * straight off a camera would be tens of megabytes of it.
   */
  private async useImage(file: File) {
    if (!file.type.startsWith("image/")) {
      this.say("That file is not an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.say(
        `That image is ${Math.round(file.size / 1e6)}MB. Please pick one under ${
          MAX_IMAGE_BYTES / 1e6
        }MB.`
      );
      return;
    }

    try {
      const image = await readAsDataUrl(file);
      this.change({ customWallpaper: image, wallpaper: CUSTOM_WALLPAPER });
    } catch {
      this.say("That image could not be read.");
    }
  }

  /** A line under the control, rather than an alert that blocks the desktop. */
  private say(message: string) {
    this.notice = message;
    this.render();
  }

  private render() {
    const current = appearance.get();
    this.body.textContent = "";

    this.body.appendChild(
      group("Appearance", [
        row(
          "Theme",
          "System follows your device.",
          segmented(
            THEME_CHOICES.map((choice) => ({
              value: choice.value,
              label: choice.label,
              selected: current.theme === choice.value
            })),
            (value, from) =>
              this.change({ theme: value as Appearance["theme"] }, from)
          )
        ),
        row(
          "Wallpaper",
          "Each one is drawn, and has a version for both themes.",
          this.wallpaperControl(current)
        ),
        row(
          "Accent",
          "Controls, focus rings and selected text.",
          swatches(
            Object.entries(accentPalette).map(([id, accent]) => ({
              id,
              label: accent.name,
              selected: current.accent === id,
              background: accent[appearance.scheme()],
              round: true
            })),
            (id, from) => this.change({ accent: id }, from)
          )
        ),
        row(
          "Corners",
          "How hard the edges are, everywhere at once.",
          segmented(
            Object.entries(cornerStyles).map(([id, style]) => ({
              value: id,
              label: style.name,
              selected: current.corners === id
            })),
            (value, from) => this.change({ corners: value }, from)
          )
        )
      ])
    );

    this.body.appendChild(
      group("Desktop", [
        row(
          "Reduce motion",
          "Windows and menus appear without animating.",
          toggle(current.reduceMotion, (on) =>
            this.change({ reduceMotion: on })
          )
        ),
        row(
          "24-hour clock",
          "Applies to the clock in the taskbar.",
          toggle(current.clock24, (on) => this.change({ clock24: on }))
        )
      ])
    );

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "settings-reset";
    reset.appendChild(document.createTextNode("Reset to defaults"));
    reset.addEventListener("click", () => {
      appearance.set({ ...DEFAULT_APPEARANCE });
      void clearSettings();
    });

    this.body.appendChild(
      group("Reset", [
        row("Start again", "Puts every setting above back as it shipped.", reset)
      ])
    );
  }

  async load(element: HTMLElement) {
    await super.load(element);
    this.stopObserving = observeWidth(this.element, NARROW_CONTENT_PX);
  }

  async unload() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    await super.unload();
  }
}

// ------------------------------------------------------------------ builders

function group(legend: string, rows: HTMLElement[]): HTMLElement {
  const section = document.createElement("section");
  section.className = "settings-group";

  const heading = document.createElement("p");
  heading.className = "settings-legend";
  heading.appendChild(document.createTextNode(legend));
  section.appendChild(heading);

  rows.forEach((r) => section.appendChild(r));
  return section;
}

function row(label: string, hint: string, control: HTMLElement): HTMLElement {
  const element = document.createElement("div");
  element.className = "settings-row";

  const text = document.createElement("div");
  const name = document.createElement("p");
  name.className = "settings-label";
  name.appendChild(document.createTextNode(label));
  text.appendChild(name);

  const description = document.createElement("p");
  description.className = "settings-hint";
  description.appendChild(document.createTextNode(hint));
  text.appendChild(description);

  element.appendChild(text);
  element.appendChild(control);
  return element;
}

function segmented(
  options: { value: string; label: string; selected: boolean }[],
  // Handed the button as well as the value, so a change can be animated out of
  // the control that made it.
  onPick: (value: string, from: HTMLElement) => void
): HTMLElement {
  const element = document.createElement("div");
  element.className = "settings-segmented";
  element.setAttribute("role", "group");

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-pressed", String(option.selected));
    button.appendChild(document.createTextNode(option.label));
    button.addEventListener("click", () => onPick(option.value, button));
    element.appendChild(button);
  });

  return element;
}

function swatches(
  options: {
    id: string;
    label: string;
    selected: boolean;
    background: string;
    round?: boolean;
  }[],
  onPick: (id: string, from: HTMLElement) => void
): HTMLElement {
  const element = document.createElement("div");
  element.className = "settings-swatches";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `settings-swatch${option.round ? " is-accent" : ""}`;
    button.style.background = option.background;
    // The swatch is the colour itself, so the name has to be said out loud.
    button.setAttribute("aria-label", option.label);
    button.title = option.label;
    button.setAttribute("aria-pressed", String(option.selected));
    button.addEventListener("click", () => onPick(option.id, button));
    element.appendChild(button);
  });

  return element;
}

function toggle(on: boolean, onChange: (on: boolean) => void): HTMLElement {
  const host = document.createElement("div");
  const shownSwitch = new SwitchToggle(14, undefined, undefined, on);
  shownSwitch.load(host);
  shownSwitch.setOnClick(function (this: SwitchToggle) {
    const input = this.element.querySelector<HTMLInputElement>(
      "input[type=checkbox]"
    );
    onChange(Boolean(input?.checked));
  });
  return host;
}

const MAX_IMAGE_BYTES = 8_000_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default SettingsApp;
export { SettingsContent };
