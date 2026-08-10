import jss, { StyleSheet } from "jss";
import Logger from "../Logger";

class OSElement {
  parent: HTMLElement | null = null;
  element: HTMLElement;
  id: string;
  style!: () => any;
  className?: string;
  styleSheet: StyleSheet | null = null;
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

  /**
   * Take it off the screen — whatever else goes wrong.
   *
   * Two things here are deliberate, and both come from the same failure: a
   * component that is torn down halfway can never be shown again, because
   * `load()` sees a `parent` still set, decides it is already mounted, and
   * quietly does nothing for the rest of the session. That is the shape of the
   * start menu bug that kept returning — a press that appeared to do nothing,
   * and a second press that worked.
   *
   *   - The detach runs in a `finally`, so a `beforeUnload` hook that rejects —
   *     a subscription that has already gone, a scrollbar pointed at a node
   *     that was rebuilt — cannot skip it. The error still reaches the caller;
   *     it just cannot stop the element leaving.
   *   - `remove()` rather than `parent.removeChild()`, which throws when the
   *     element is not where the parent believes it is. `remove()` on something
   *     already detached is a no-op, so the pointer and the DOM always agree.
   */
  async unload() {
    try {
      await this.beforeUnload();
      this.logger.debug(`Finished beforeUnload hook`);
    } finally {
      this.element.remove();
      this.parent = null;

      this.unloadStyle();
      this.logger.debug(`Finished unloadStyle hook`);
    }

    await this.afterUnload();
    this.logger.debug(`Finished afterUnload hook`);

    this.logger.debug(`Unloaded Instance`);
  }
  public getElement() {
    return this.element;
  }

  public updateDimension(x: number, y: number, width: number, height: number) {
    this.element.style.top = `${y}px`
    this.element.style.left = `${x}px`
    this.element.style.width = `${width}px`
    this.element.style.height = `${height}px`
  }
}

export default OSElement;
