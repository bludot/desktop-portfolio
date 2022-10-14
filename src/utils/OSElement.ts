import jss, { StyleSheet } from "jss";
import Logger from "../Logger";

class OSElement {
  parent: HTMLElement;
  element: HTMLElement;
  id: string;
  style: () => any;
  className: string;
  styleSheet: StyleSheet;
  instanceName: string;
  logger: Logger;
  constructor(tagName: string, id: string, instanceName?: string) {
    this.element = document.createElement(tagName);
    this.element.id = this.id = id;
    this.instanceName = instanceName || tagName;
    this.logger = new Logger(this.instanceName);
    this.logger.debug(`Initializing`);
  }

  applyStyle() {
    this.logger.debug(`Applying styles`);
    if (this.styleSheet) {
      this.styleSheet.detach();
    }
    this.styleSheet = jss.createStyleSheet(this.style());
    const { classes } = this.styleSheet.attach();
    this.element.className += " " + classes[this.id];
  }
  unloadStyle() {
    this.logger.debug(`Unloading styles`);
    if (this.styleSheet) {
      this.styleSheet.detach();
      this.styleSheet = null;
    }
    this.logger.debug(`Unloaded styles`);
  }

  public async beforeLoad() {
    this.logger.debug(`beforeLoad hook`);
  }
  public async afterLoad() {
    this.logger.debug(`afterLoad hook`);
  }
  public async load(element: HTMLElement) {
    this.logger.debug(`Loading Instance`);

    await this.beforeLoad();
    this.logger.debug(`Finished beforeLoad hook`);

    if (this.parent) {
      console.log(this.parent)
      throw new Error("Already loaded! did you mean to reload?");
    }

    this.parent = element;
    if (this.className) {
      this.element.className = this.className;
    }

    this.applyStyle();
    this.logger.debug(`Applyied styles`);

    this.parent.appendChild(this.element);

    await this.afterLoad();
    this.logger.debug(`Finished afterLoad hook`);

    this.logger.debug(`Loaded Instance`);
  }
  public async beforeUnload(): Promise<void> {
    this.logger.debug(`beforeUnload hook`);
  }
  public async afterUnload(): Promise<void> {
    this.logger.debug(`afterUnload hook`);
  }

  async unload() {
    await this.beforeUnload();
    this.logger.debug(`Finished beforeUnload hook`);

    this.parent.removeChild(this.element);
    this.parent = null;

    this.unloadStyle();
    this.logger.debug(`Finished unloadStyle hook`);

    await this.afterUnload();
    this.logger.debug(`Finished afterUnload hook`);

    this.logger.debug(`Unloaded Instance`);
  }
  reload() {
    this.logger.debug(`Reloading Instance`);
    const tmpParent = this.parent;
    this.unload();
    this.load(tmpParent);
    this.applyStyle();

    this.logger.debug(`Reloaded Instance`);
  }

  public getElement() {
    return this.element;
  }
}

export default OSElement;
