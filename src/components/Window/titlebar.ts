import OSElement from "../../utils/OSElement";

class Title extends OSElement {
  title: string;
  constructor({ title }: { title: string }) {
    super("title", "title");
    this.title = title;
    this.style = () => ({
      [this.id]: {
        height: "32px",
        position: "relative",
        background: "transparent",
        lineHeight: "32px",
        flex: "1 1 auto",
        display: "flex",
        flexFlow: "row nowrap",
        textAlign: "center",
        justifyContent: "center"
        // zIndex: 9001,
      }
    });
  }

  load(element: HTMLElement) {
    this.element.appendChild(document.createTextNode(this.title));
    super.load(element);
  }
}

class TitleBar extends OSElement {
  title: Title;
  className: string;
  parent: HTMLElement;
  constructor({ title, className }: { title: string; className: string }) {
    super("titlebar", "title-bar");
    this.className = className;
    this.title = new Title({ title });
    this.title.load(this.element);
    this.style = () => ({
      [this.id]: {
        flex: "1 1 auto"
      }
    });
  }

  applyTitle(title) {
    this.title = title;
    // this.element.append(this.title);
    this.title.load(this.element);
  }
  load(element: HTMLElement) {
    super.load(element);
  }
}

export default TitleBar;
