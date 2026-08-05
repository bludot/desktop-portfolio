import type { Layer, Scheme } from "./engine";

/**
 * The accent, as a layer over whichever theme is in force.
 *
 * There is exactly one accent on screen at a time and it is meant to appear at
 * most twice per window. Each carries two values because a hue chosen to read
 * as considered on paper turns to mud on near-black — the dark variant is
 * lifted, not the same colour.
 */

interface AccentDefinition {
  name: string;
  light: string;
  dark: string;
}

export const accentPalette: Record<string, AccentDefinition> = {
  rose: { name: "Rose", light: "#9c4f6a", dark: "#e294ac" },
  moss: { name: "Moss", light: "#4f7355", dark: "#8fc79c" },
  sea: { name: "Sea", light: "#3f6f7d", dark: "#7cc0d1" },
  amber: { name: "Amber", light: "#8a5a2b", dark: "#dda76a" }
};

export const DEFAULT_ACCENT = "rose";

/**
 * Nudge a hex colour towards black, for the pressed state. Small and local: it
 * only ever has one job, so it does not need to be a colour library.
 */
export function shade(hex: string, amount: number): string {
  const match = /^#([\da-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  const channel = (shift: number) => {
    const part = (value >> shift) & 0xff;
    return Math.max(0, Math.min(255, Math.round(part * (1 + amount))));
  };
  const hex2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex2(channel(16))}${hex2(channel(8))}${hex2(channel(0))}`;
}

/** The same hex at a given alpha, for washes drawn from the accent. */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([\da-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  const [r, g, b] = [16, 8, 0].map((shift) => (value >> shift) & 0xff);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Falls back rather than throwing: a stored accent may no longer exist. */
export const accentLayer = (id: string): Layer => {
  const key = accentPalette[id] ? id : DEFAULT_ACCENT;
  const accent = accentPalette[key];
  return {
    id: key,
    name: accent.name,
    tokens: (scheme: Scheme) => ({
      "--accent": accent[scheme],
      "--accent-pressed": shade(accent[scheme], -0.12),
      // Selected text is drawn from the accent too, so picking one changes
      // every highlight on the desktop rather than just the controls.
      "--selection": withAlpha(accent[scheme], scheme === "dark" ? 0.36 : 0.28)
    })
  };
};
