import jss from "jss";
import { color, motion } from "./tokens";

/**
 * The handful of rules that belong to the document rather than to a component:
 * text selection, and the focus ring nothing else owns.
 *
 * Attached once, and built from tokens like everything else, so changing accent
 * changes what selected text looks like without this being rebuilt.
 */
/**
 * How wide the soft band at the front of the ripple is.
 *
 * Wide enough that the edge never resolves into a line, narrow enough that the
 * two themes are not both half-visible across most of the screen at once.
 */
export const FEATHER_PX = 140;

let sheet: ReturnType<typeof jss.createStyleSheet> | null = null;

export function attachGlobalStyles() {
  if (sheet) return sheet;
  sheet = jss.createStyleSheet({
    "@global": {
      "::selection": {
        background: "var(--selection)",
        color: color.ink
      },
      "::-moz-selection": {
        background: "var(--selection)",
        color: color.ink
      },
      /*
       * The selection layer draws its own rounded shapes and turns this off by
       * putting the class on the root. Gated on the class rather than switched
       * off outright, so a desktop where that layer never mounts still shows a
       * selection — square, but visible.
       */
      ".has-selection-layer ::selection": { background: "transparent" },
      ".has-selection-layer ::-moz-selection": { background: "transparent" },

      /*
       * How an appearance change is drawn.
       *
       * The fallback, for a browser that cannot do the ripple: the browser's
       * own cross-fade, slowed to this desktop's timing, because the default is
       * quick enough to still read as a cut.
       */
      "::view-transition-old(root), ::view-transition-new(root)": {
        animationDuration: `${motion.slow}ms`,
        animationTimingFunction: motion.standard
      },

      /*
       * The ripple.
       *
       * The old desktop is held still and the new one spreads over it from
       * wherever the change was made, so both default animations have to go —
       * one has nothing to do, and the other is being driven by hand.
       *
       * `plus-lighter` is what makes the browser's cross-fade hold its
       * brightness through the middle, and it is wrong here: these two pictures
       * are not blending, one is arriving over the other.
       */
      ":root.is-revealing::view-transition-old(root)": {
        animation: "none"
      },
      ":root.is-revealing::view-transition-new(root)": {
        animation: "none",
        mixBlendMode: "normal",
        /*
         * The soft edge, and the reason this is a mask rather than a clip path.
         *
         * `clip-path` can only cut, and a hard circle sweeping across the
         * screen reads as a wipe — a shape passing over the desktop. The band
         * between the two stops is what turns it into a front that arrives:
         * opaque behind, clear ahead, and a nine-tenths-of-an-inch crossfade in
         * between that no edge is ever visible in.
         *
         * `--ripple` is a registered property, which is the only reason any of
         * this moves: an ordinary custom property jumps from its first value to
         * its last at the halfway point, taking the gradient with it.
         */
        maskImage: `radial-gradient(circle at var(--ripple-x) var(--ripple-y), #000 calc(var(--ripple) - ${FEATHER_PX}px), transparent var(--ripple))`,
        WebkitMaskImage: `radial-gradient(circle at var(--ripple-x) var(--ripple-y), #000 calc(var(--ripple) - ${FEATHER_PX}px), transparent var(--ripple))`
      }
    }
  });
  sheet.attach();
  return sheet;
}
