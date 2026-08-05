/**
 * The design system, in one import.
 *
 * `tokens` is what components style against; everything else is the engine that
 * decides what those tokens resolve to. Components should only ever need the
 * tokens — if one is reaching for a theme or a layer, the value it wants
 * probably belongs in the token set instead.
 */

export * from "./tokens";

export { default as engine, ThemeEngine } from "./engine";
export type { Theme, Layer, Tokens, Scheme } from "./engine";

export { themes, light, dark } from "./themes";
export {
  accentPalette,
  accentLayer,
  shade,
  withAlpha,
  DEFAULT_ACCENT
} from "./accents";
export { cornerStyles, cornersLayer, DEFAULT_CORNERS } from "./corners";
export { attachGlobalStyles, FEATHER_PX } from "./global";
export {
  wallpapers,
  wallpaperLayer,
  customWallpaperLayer,
  CUSTOM_WALLPAPER,
  DEFAULT_WALLPAPER
} from "./wallpapers";
export type { Wallpaper } from "./wallpapers";
