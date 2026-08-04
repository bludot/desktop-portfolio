/**
 * The design tokens for the desktop.
 *
 * Everything visual should come from here rather than from literals in each
 * component. Before this existed the palette was seven separate `#ccc`s plus a
 * stray `#738dff` and a `#2196F3`, which is why nothing quite matched.
 *
 * Neutrals are biased warm-violet so they belong to the wallpaper instead of
 * reading as dead grey. There is exactly one accent, and it is meant to appear
 * at most twice on any given screen; `current` is semantic and sits outside
 * that budget.
 */

export const color = {
  ink: "#2b2530",
  inkSoft: "#6a6272",
  inkFaint: "#948da0",

  line: "rgba(43, 37, 48, .12)",
  lineSoft: "rgba(43, 37, 48, .07)",

  /** Window glass, focused and resting. */
  glass: "rgba(255, 255, 255, .58)",
  glassRest: "rgba(255, 255, 255, .40)",
  glassEdge: "rgba(255, 255, 255, .75)",
  /** Taskbar and launcher sit slightly further back than a window. */
  chrome: "rgba(255, 255, 255, .5)",
  chromeRaised: "rgba(255, 255, 255, .72)",

  accent: "#9c4f6a",
  accentPressed: "#8b4460",
  /** Reserved for "this is happening now". Never decorative. */
  current: "#4a7c59",

  desktop: "#f2ddda",
} as const;

/** 1.25 scale, capped at the sizes the product actually needs. */
export const size = {
  display: "22px",
  heading: "15px",
  body: "13.5px",
  bodyTight: "13px",
  small: "12.5px",
  caption: "11px",
  micro: "10.5px",
} as const;

/**
 * Three weights, not five. Read / emphasise / announce.
 * The old build set a 34px name at 200, which has no presence at that size.
 */
export const weight = {
  read: 400,
  emphasise: 550,
  announce: 600,
} as const;

/** Uppercase needs positive tracking; display needs negative. */
export const tracking = {
  display: "-.02em",
  heading: "-.008em",
  body: "0",
  caps: ".08em",
  mono: ".04em",
} as const;

export const font = {
  ui: `"Segoe UI", Roboto, "Helvetica Neue", Avenir, "Noto Sans", sans-serif`,
  mono: `ui-monospace, "SF Mono", SFMono-Regular, "Cascadia Mono", Menlo, Consolas, monospace`,
} as const;

export const radius = {
  window: "10px",
  control: "6px",
  chip: "5px",
  pill: "8px",
} as const;

export const shadow = {
  window:
    "0 24px 48px -20px rgba(60, 40, 70, .34), 0 4px 12px -6px rgba(60, 40, 70, .16)",
  windowRest: "0 8px 20px -14px rgba(60, 40, 70, .3)",
  chrome: "0 14px 30px -18px rgba(60, 40, 70, .4)",
  /** Hairline drawn with an inset shadow so it survives translucency. */
  edge: "inset 0 0 0 1px rgba(255, 255, 255, .75)",
  edgeRest: "inset 0 0 0 1px rgba(255, 255, 255, .55)",
} as const;

export const blur = {
  window: "blur(30px) saturate(1.45)",
  chrome: "blur(28px) saturate(1.4)",
} as const;

export const space = {
  windowPadX: "21px",
  windowPadY: "19px",
  titlebarHeight: "34px",
} as const;
