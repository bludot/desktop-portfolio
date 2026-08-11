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
  /** A window's own fill. More tint, because it is blurred once — see themes. */
  glassWindow: "var(--glass-window)",
  glassWindowRest: "var(--glass-window-rest)",
  glassEdge: "var(--glass-edge)",
  /** Taskbar and launcher sit slightly further back than a window. */
  chrome: "var(--chrome)",
  /** The taskbar's own fill. More tint, because it is blurred once now. */
  chromeSolid: "var(--chrome-solid)",
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

/**
 * Source code colours.
 *
 * Deliberately drawn from the accent family's hues rather than a stock
 * highlighter palette, so a file reads as part of this desktop. The one-accent
 * rule does not apply here: syntax colour is data about the text, the way a
 * chart's series colours are, not decoration.
 */
export const code = {
  comment: "var(--code-comment)",
  string: "var(--code-string)",
  keyword: "var(--code-keyword)",
  number: "var(--code-number)",
  name: "var(--code-name)",
  type: "var(--code-type)",
  meta: "var(--code-meta)",
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
  /*
   * One filter, and a gentler saturation than the two it replaces.
   *
   * A window used to carry this and hold a layer carrying it again. Two
   * chained filters do not compose the way multiplying their parameters
   * suggests — the outer blur averages the inner one's saturation back down —
   * so this was matched to the old rendering by measurement rather than by
   * arithmetic: saturation and luminance land within a point of where they
   * were, across the window's interior.
   */
  window: "blur(30px) saturate(1.2)",
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
  /**
   * A change that crosses the whole screen.
   *
   * Longer than anything else here on purpose: the others move one thing a
   * short distance, this one travels the diagonal of the display, and at 320ms
   * that reads as a flash rather than as something spreading.
   */
  sweep: 620,
  standard: "cubic-bezier(.2, .8, .3, 1)",
  exit: "cubic-bezier(.4, 0, 1, 1)",
} as const;

export const space = {
  windowPadX: "21px",
  windowPadY: "19px",
  titlebarHeight: "34px",
} as const;
