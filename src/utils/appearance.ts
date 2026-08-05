import {
  engine,
  accentLayer,
  wallpaperLayer,
  customWallpaperLayer,
  cornersLayer,
  CUSTOM_WALLPAPER,
  DEFAULT_ACCENT,
  DEFAULT_CORNERS,
  DEFAULT_WALLPAPER,
  themes
} from "../theme";
import type { Scheme } from "../theme";

/**
 * What the desktop lets you change about how it looks, and where that choice
 * is kept.
 *
 * The split is deliberate: the theme engine is the mechanism — compose tokens,
 * write them to the root — and this is the policy. It holds the preferences,
 * resolves "system" against the OS, persists, and tells the engine what to put
 * on screen. Neither knows how the other works.
 */

/** "system" follows the OS rather than pinning a theme. */
export type ThemeChoice = Scheme | "system";

export interface Appearance {
  theme: ThemeChoice;
  wallpaper: string;
  accent: string;
  /** How hard the desktop's edges are. */
  corners: string;
  /** Movement off, over and above whatever the OS already asks for. */
  reduceMotion: boolean;
  /** 24-hour clock in the taskbar, rather than the locale's default. */
  clock24: boolean;
  /** An uploaded image, as a data URL. Only used when wallpaper is "custom". */
  customWallpaper?: string;
}

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "system",
  wallpaper: DEFAULT_WALLPAPER,
  accent: DEFAULT_ACCENT,
  corners: DEFAULT_CORNERS,
  reduceMotion: false,
  clock24: true
};

engine.register(...themes);

const prefersDark = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

/** The theme actually in force, with "system" resolved against the OS. */
export const resolveTheme = (choice: ThemeChoice): Scheme =>
  choice === "system" ? (prefersDark() ? "dark" : "light") : choice;

type Listener = (appearance: Appearance) => void;

class AppearanceController {
  private current: Appearance = { ...DEFAULT_APPEARANCE };
  private listeners: Listener[] = [];
  private watching = false;

  get(): Appearance {
    return { ...this.current };
  }

  /** The scheme on screen right now, never "system". */
  scheme(): Scheme {
    return resolveTheme(this.current.theme);
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      }
    };
  }

  /** Set without persisting — used when loading what was already stored. */
  hydrate(saved: Partial<Appearance>) {
    this.current = { ...this.current, ...saved };
    this.apply();
    this.listeners.forEach((l) => l(this.get()));
  }

  set(patch: Partial<Appearance>) {
    this.hydrate(patch);
  }

  apply() {
    engine.apply(this.scheme(), [
      accentLayer(this.current.accent),
      cornersLayer(this.current.corners),
      this.paper()
    ]);
    this.watchSystem();
  }

  /** Falls back to a drawn sky if "custom" is chosen with nothing uploaded. */
  private paper() {
    const { wallpaper, customWallpaper } = this.current;
    return wallpaper === CUSTOM_WALLPAPER && customWallpaper
      ? customWallpaperLayer(customWallpaper)
      : wallpaperLayer(wallpaper);
  }

  /**
   * Follow the OS while the theme is "system", and stop caring once it is
   * pinned. Registered once, with the guard inside, rather than being attached
   * and detached as the setting changes.
   */
  private watchSystem() {
    if (this.watching) return;
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof query.addEventListener !== "function") return;

    query.addEventListener("change", () => {
      if (this.current.theme === "system") this.apply();
    });
    this.watching = true;
  }
}

const appearance = new AppearanceController();
export default appearance;
