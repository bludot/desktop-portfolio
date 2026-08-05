import jss from "jss";
import { color } from "./tokens";

/**
 * The handful of rules that belong to the document rather than to a component:
 * text selection, and the focus ring nothing else owns.
 *
 * Attached once, and built from tokens like everything else, so changing accent
 * changes what selected text looks like without this being rebuilt.
 */
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
      ".has-selection-layer ::-moz-selection": { background: "transparent" }
    }
  });
  sheet.attach();
  return sheet;
}
