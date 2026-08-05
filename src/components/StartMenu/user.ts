import OSElement from "../../utils/OSElement";
import { color, font, size, tracking, weight } from "../../theme";

/**
 * The name at the top of the launcher.
 *
 * Styled through the sheet rather than inline, so it belongs to whichever theme
 * is in force. It used to carry a hardcoded #2b2530 — the light ink — which on
 * a dark launcher was near-black text on a near-black panel, and the name was
 * effectively invisible.
 */
class User extends OSElement {
  constructor() {
    super("userinfo", "user-info");
    this.style = () => ({
      [this.id]: {
        borderRadius: "100%",
        position: "relative",
        flex: "1 1 auto",
        margin: "10px 10px",
        userSelect: "none",
        "& > h1": {
          margin: "5px 0",
          flex: "1 1 auto",
          fontFamily: font.ui,
          fontSize: size.display,
          fontWeight: weight.announce,
          letterSpacing: tracking.display,
          color: color.ink,
          whiteSpace: "nowrap"
        },
        // The one accent in the launcher.
        "& > sub": {
          display: "block",
          margin: "5px 0",
          flex: "1 1 auto",
          fontFamily: font.mono,
          fontSize: size.caption,
          fontWeight: weight.read,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.accent,
          whiteSpace: "nowrap"
        }
      }
    });

    const header = document.createElement("h1");
    header.appendChild(document.createTextNode("James Trotter"));

    const subtitle = document.createElement("sub");
    subtitle.appendChild(document.createTextNode("Software Engineer"));

    this.element.appendChild(header);
    this.element.appendChild(subtitle);
  }
}

export default User;
