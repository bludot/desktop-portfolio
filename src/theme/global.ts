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
      }
    }
  });
  sheet.attach();
  return sheet;
}
