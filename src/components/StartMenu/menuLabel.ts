import OSElement from "../../utils/OSElement";
import { color, font, size } from "../../theme";

/**
 * A group heading in the launcher, or a hairline between groups.
 *
 * An `OSElement` rather than a bare `appendChild`, because everything else in
 * the menu is one and they all mount through `load`, which is asynchronous.
 * A synchronous append runs before every queued load resolves, so a label added
 * that way jumps to the top of the menu no matter where it was written — which
 * is exactly what it did. Going through the same door keeps a group heading
 * above the group it names.
 */
class MenuLabel extends OSElement {
  constructor(text?: string) {
    super("span", "menu-label");
    this.style = () => ({
      [this.id]: text
        ? {
            display: "block",
            padding: "12px 10px 2px",
            fontFamily: font.mono,
            fontSize: size.micro,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: color.inkFaint
          }
        : {
            display: "block",
            height: "1px",
            margin: "10px 6px 2px",
            background: color.lineSoft
          }
    });

    if (text) {
      this.element.appendChild(document.createTextNode(text));
    } else {
      this.element.setAttribute("aria-hidden", "true");
    }
  }
}

export default MenuLabel;
