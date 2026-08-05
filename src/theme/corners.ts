import type { Layer } from "./engine";

/**
 * How hard the desktop's edges are.
 *
 * Corner radius is the cheapest lever there is on how a system feels — the same
 * layout reads as engineered at 0 and as friendly at 18 — so it is a setting
 * rather than a constant. The four values move together on a ratio: a window is
 * the largest surface and takes the most, a chip the least, and the pill is
 * whatever it takes to be fully round at control height.
 */

interface CornerStyle {
  name: string;
  window: string;
  control: string;
  chip: string;
  pill: string;
}

export const cornerStyles: Record<string, CornerStyle> = {
  sharp: {
    name: "Sharp",
    window: "0px",
    control: "0px",
    chip: "0px",
    pill: "0px"
  },
  soft: {
    name: "Soft",
    window: "10px",
    control: "6px",
    chip: "5px",
    pill: "8px"
  },
  round: {
    name: "Round",
    window: "18px",
    control: "11px",
    chip: "9px",
    pill: "999px"
  }
};

export const DEFAULT_CORNERS = "soft";

/** Falls back rather than throwing: a stored choice may no longer exist. */
export const cornersLayer = (id: string): Layer => {
  const key = cornerStyles[id] ? id : DEFAULT_CORNERS;
  const corners = cornerStyles[key];
  return {
    id: key,
    name: corners.name,
    tokens: () => ({
      "--radius-window": corners.window,
      "--radius-control": corners.control,
      "--radius-chip": corners.chip,
      "--radius-pill": corners.pill
    })
  };
};
