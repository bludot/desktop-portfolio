import jss, { StyleSheet } from "jss";

class OSElement {
  parent: HTMLElement;
  element: HTMLElement;
  id: string;
  style: () => any;
  className: string;
  styleSheet: StyleSheet;
  constructor(tagName: string, id: string) {
    this.element = document.createElement(tagName);
    this.element.id = this.id = id;
  }

  applyStyle() {
    if (this.styleSheet) {
      this.styleSheet.detach();
    }
    this.styleSheet = jss.createStyleSheet(this.style());
    const { classes } = this.styleSheet.attach();
    this.element.className += " " + classes[this.id];
  }
  unloadStyle() {
    if (this.styleSheet) {
      this.styleSheet.detach();
      this.styleSheet = null;
    }
  }

  public beforeLoad() {}
  public afterLoad() {}
  public async load(element: HTMLElement) {
    await this.beforeLoad();
    if (this.parent) {
      throw new Error("Already loaded! did you mean to reload?");
    }
    this.parent = element;
    if (this.className) {
      this.element.className = this.className;
    }
    this.applyStyle();
    this.parent.appendChild(this.element);
    await this.afterLoad();
  }
  public beforeUnload() {}
  public afterUnload() {}

  async unload() {
    await this.beforeUnload();
    this.parent.removeChild(this.element);
    this.parent = null;
    this.unloadStyle();
    await this.afterUnload();
  }
  reload() {
    const tmpParent = this.parent;
    this.unload();
    this.load(tmpParent);
    this.applyStyle();
  }

  public getElement() {
    return this.element;
  }
}

export default OSElement;
