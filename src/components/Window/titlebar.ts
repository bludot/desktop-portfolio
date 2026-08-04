import OSElement from "../../utils/OSElement";
import { color, font, size, tracking, weight } from "../../theme";

/**
 * The window's name, and optionally what it contains — "Experience" plus
 * "7 roles". Left-aligned: the previous version centred it, which left the
 * controls stranded on the opposite side from every real window manager.
 */
class Title extends OSElement {
  title: string;
  meta?: string;

  constructor({ title, meta }: { title: string; meta?: string }) {
    super("title", "title");
    this.title = title;
    this.meta = meta;
    this.style = () => ({
      [this.id]: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        flex: "1 1 auto",
        minWidth: 0,
        fontFamily: font.ui,
        "& > .title-name": {
          fontSize: size.small,
          fontWeight: weight.announce,
          letterSpacing: tracking.heading,
          color: color.ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        },
        "& > .title-meta": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          whiteSpace: "nowrap"
        }
      }
    });
  }

  async load(element: HTMLElement) {
    const name = document.createElement("span");
    name.className = "title-name";
    name.appendChild(document.createTextNode(this.title));
    this.element.appendChild(name);

    if (this.meta) {
      const meta = document.createElement("span");
      meta.className = "title-meta";
      meta.appendChild(document.createTextNode(this.meta));
      this.element.appendChild(meta);
    }

    await super.load(element);
  }

  /** Update the contents note without rebuilding the window. */
  setMeta(meta: string) {
    this.meta = meta;
    const node = this.element.querySelector(".title-meta");
    if (node) node.textContent = meta;
  }
}

class TitleBar extends OSElement {
  title: Title;
  className: string;
  parent!: HTMLElement;

  constructor({
    title,
    className,
    meta
  }: {
    title: string;
    className: string;
    meta?: string;
  }) {
    super("titlebar", "title-bar");
    this.className = className;
    this.title = new Title({ title, meta });
    this.title.load(this.element);
    this.style = () => ({
      [this.id]: {
        flex: "1 1 auto",
        minWidth: 0,
        display: "flex",
        alignItems: "center"
      }
    });
  }

  setMeta(meta: string) {
    this.title.setMeta(meta);
  }

  async load(element: HTMLElement) {
    await super.load(element);
  }
}

export default TitleBar;
export { Title };
