/**
 * The token *names* every component styles against.
 *
 * These are CSS custom property references, never literals. Components build
 * their stylesheets once, in their constructors, so a palette of literals could
 * only change by tearing down and rebuilding every sheet on the desktop.
 * Pointing each token at a variable means switching theme is a handful of
 * writes to the root element and nothing restyles at all.
 *
 * What the variables resolve to lives in `themes.ts`, `accents.ts` and
 * `wallpapers.ts`; `engine.ts` composes them and writes them out.
 */

export const color = {
  ink: "var(--ink)",
  inkSoft: "var(--ink-soft)",
  inkFaint: "var(--ink-faint)",

  line: "var(--line)",
  lineSoft: "var(--line-soft)",

  /** Window glass, focused and resting. */
  glass: "var(--glass)",
  glassRest: "var(--glass-rest)",
  glassEdge: "var(--glass-edge)",
  /** Taskbar and launcher sit slightly further back than a window. */
  chrome: "var(--chrome)",
  chromeRaised: "var(--chrome-raised)",

  accent: "var(--accent)",
  accentPressed: "var(--accent-pressed)",
  /** Reserved for "this is happening now". Never decorative. */
  current: "var(--current)",

  desktop: "var(--desktop)",

  /** The wash under a hovered control. Light on dark, dark on light. */
  hover: "var(--hover)",
  scrollbar: "var(--scrollbar)",
  scrollbarHover: "var(--scrollbar-hover)",
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
  window: "var(--radius-window)",
  control: "var(--radius-control)",
  chip: "var(--radius-chip)",
  pill: "var(--radius-pill)",
} as const;

export const shadow = {
  window: "var(--shadow-window)",
  windowRest: "var(--shadow-window-rest)",
  chrome: "var(--shadow-chrome)",
  /** Hairline drawn with an inset shadow so it survives translucency. */
  edge: "var(--shadow-edge)",
  edgeRest: "var(--shadow-edge-rest)",
} as const;

export const blur = {
  window: "blur(30px) saturate(1.45)",
  chrome: "blur(28px) saturate(1.4)",
} as const;

/**
 * Motion tokens. Exits are quicker than entrances and use a sharper curve —
 * arriving should feel considered, leaving should get out of the way.
 */
export const motion = {
  fast: 140,
  base: 220,
  slow: 320,
  standard: "cubic-bezier(.2, .8, .3, 1)",
  exit: "cubic-bezier(.4, 0, 1, 1)",
} as const;

export const space = {
  windowPadX: "21px",
  windowPadY: "19px",
  titlebarHeight: "34px",
} as const;
