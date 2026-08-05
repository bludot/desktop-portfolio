import type { Theme } from "./engine";

/**
 * The two base themes.
 *
 * Neutrals are biased warm-violet so they belong to the wallpaper instead of
 * reading as dead grey. Dark is designed rather than inverted: flipping the
 * light values gives muddy text and shadows that vanish, so the neutrals keep
 * their cast while the "current" green is lifted until it carries on a dark
 * ground. Accents are a layer of their own — see `accents.ts`.
 */

export const light: Theme = {
  id: "light",
  name: "Light",
  scheme: "light",
  tokens: {
    "--ink": "#2b2530",
    "--ink-soft": "#6a6272",
    /*
     * Darkened from #948da0, which came out at 2.7:1 on window glass — every
     * date, label and meta line on the desktop was drawn in it.
     *
     * It now sits very close to `--ink-soft`, which loses the two tiers as
     * colours. That is the trade: at 10.5px there is no room under 4.5:1 for a
     * lighter one. The tiers still read, because everything faint is also mono,
     * smaller, and usually uppercase — the hierarchy is carried by the
     * typography rather than by the ink.
     */
    "--ink-faint": "#6b6478",

    "--line": "rgba(43, 37, 48, .12)",
    "--line-soft": "rgba(43, 37, 48, .07)",

    "--glass": "rgba(255, 255, 255, .58)",
    "--glass-rest": "rgba(255, 255, 255, .40)",
    "--glass-edge": "rgba(255, 255, 255, .75)",
    "--chrome": "rgba(255, 255, 255, .5)",
    "--chrome-raised": "rgba(255, 255, 255, .72)",

    "--current": "#4a7c59",
    "--desktop": "#f2ddda",

    "--hover": "rgba(255, 255, 255, .5)",
    "--scrollbar": "rgba(90, 90, 90, .45)",
    "--scrollbar-hover": "rgba(60, 60, 60, .7)",

    "--shadow-window":
      "0 24px 48px -20px rgba(60, 40, 70, .34), 0 4px 12px -6px rgba(60, 40, 70, .16)",
    "--shadow-window-rest": "0 8px 20px -14px rgba(60, 40, 70, .3)",
    "--shadow-chrome": "0 14px 30px -18px rgba(60, 40, 70, .4)",
    "--shadow-edge": "inset 0 0 0 1px rgba(255, 255, 255, .75)",
    "--shadow-edge-rest": "inset 0 0 0 1px rgba(255, 255, 255, .55)"
  }
};

export const dark: Theme = {
  id: "dark",
  name: "Dark",
  scheme: "dark",
  tokens: {
    "--ink": "#ece7f2",
    "--ink-soft": "#a9a2b8",
    // Lifted from #7b7490, which came out at 3.6:1 against a dark window and
    // was the one thing on the desktop that failed to be readable. Everything
    // faint — dates, meta lines, labels — is drawn in this.
    "--ink-faint": "#928ba6",

    "--line": "rgba(236, 231, 242, .14)",
    "--line-soft": "rgba(236, 231, 242, .07)",

    // Glass goes dark rather than white-translucent, or every window would
    // read as a sheet of frosted paper laid over a night sky.
    "--glass": "rgba(40, 34, 51, .66)",
    "--glass-rest": "rgba(40, 34, 51, .48)",
    "--glass-edge": "rgba(255, 255, 255, .12)",
    "--chrome": "rgba(32, 27, 41, .6)",
    "--chrome-raised": "rgba(60, 52, 76, .72)",

    "--current": "#74c295",
    "--desktop": "#1b1724",

    // A light wash on a dark ground, not the white one, which would glare.
    "--hover": "rgba(255, 255, 255, .09)",
    "--scrollbar": "rgba(222, 216, 234, .32)",
    "--scrollbar-hover": "rgba(236, 231, 242, .58)",

    // Near-black shadows: the violet cast that gives light windows their lift
    // just turns to haze against a dark ground.
    "--shadow-window":
      "0 24px 48px -20px rgba(0, 0, 0, .62), 0 4px 12px -6px rgba(0, 0, 0, .44)",
    "--shadow-window-rest": "0 8px 20px -14px rgba(0, 0, 0, .55)",
    "--shadow-chrome": "0 14px 30px -18px rgba(0, 0, 0, .55)",
    "--shadow-edge": "inset 0 0 0 1px rgba(255, 255, 255, .10)",
    "--shadow-edge-rest": "inset 0 0 0 1px rgba(255, 255, 255, .06)"
  }
};

export const themes = [light, dark];
