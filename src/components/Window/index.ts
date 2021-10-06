import OSElement from "../../utils/OSElement";
import { getWindowWidth, getWindowHeight } from "./../../utils/utils";
import Desktop from "./../Desktop";
import { IWindow } from "./interfaces";
import TopBar from "./topbar";
import WindowBlur from "./blur";

class OSWindow extends OSElement {
  windowPosition: any;
  className: string = "window";
  title: string;
  content: any;
  desktop: Desktop;
  onActive: (window: OSWindow) => void;
  onClose: (window: OSWindow) => void;
  center: boolean = false;
  topbar: TopBar;
  active: boolean = true;
  dimensions: {
    width: number;
    height: number;
  } = {
    width: 400,
    height: 400,
  };
  constructor({
    title,
    content,
    desktop,
    onActive,
    onClose,
    center = true,
    dimensions = {
      width: 400,
      height: 400,
    },
  }: IWindow) {
    super("window", "window");
    // const blur = document.createElement("blur");
    const blur = new WindowBlur(60, 8);

    // this.element.appendChild(blur);
    blur.load(this.element);
    this.title = title;
    this.content = content;
    this.desktop = desktop;
    this.windowPosition = {};
    this.onActive = onActive;
    this.onClose = onClose;
    this.center = center;
    this.dimensions = dimensions;
    this.topbar = new TopBar({ title, close: () => this.onClose(this) });
    this.style = () => ({
      [this.id]: {
        background: "rgba(200,200,200, .5)",
        position: "fixed",
        top: 0,
        left: 0,
        height: `${this.dimensions.height}px`,
        width: `${this.dimensions.width}px`,
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: this.active
          ? `0 17px 50px 0 rgba(0, 0, 0, 0.19),
        0 12px 15px 0 rgba(0, 0, 0, 0.24)`
          : `0px 2px 5px 0px rgba(0, 0, 0, 0.16),
                0 2px 5px 0 rgba(0, 0, 0, 0.26)`,
        display: "flex",
        flexFlow: "column nowrap",
      },
    });
  }

  unfocus() {
    this.active = false;
    this.applyStyle();
  }
  focus() {
    this.active = true;
    this.applyStyle();
  }
  setIndex(index: number): void {
    // console.log("THIS", this);
    this.element.style.zIndex = index.toString();
  }

  mouseup(e: MouseEvent): void {
    window.removeEventListener("mousemove", this.mousemove.bind(this));
    window.removeEventListener("mouseup", this.mouseup.bind(this));
    //window.removeEventListener("mousemove", this.mouseMoveLeft);
    //window.removeEventListener("mousemove", this.mouseMoveTop);
    this.windowPosition = {};
  }
  mousemove(e: MouseEvent): void {
    this.element.style.top = e.pageY - this.windowPosition.top + "px";
    this.element.style.left = e.pageX - this.windowPosition.left + "px";
  }

  mousedown(e: MouseEvent): void {
    if (
      this.windowPosition && // 👈 null and undefined check
      Object.keys(this.windowPosition).length === 0 &&
      this.windowPosition.constructor === Object
    ) {
      this.windowPosition = {
        y: e.pageY,
        x: e.pageX,
        top: e.pageY - parseInt(this.element.style.top) || e.pageY,
        left: e.pageX - parseInt(this.element.style.left) || e.pageX,
      };
    }
    this.onActive(this);
    window.addEventListener("mouseup", this.mouseup.bind(this));
    window.addEventListener("mousemove", this.mousemove.bind(this));
  }

  mousedownWindow() {
    this.onActive(this);
  }

  public makeMovable(): void {
    console.log("making movable");
    this.element
      .querySelector(".topbar-window")
      .addEventListener("mousedown", this.mousedown.bind(this));
    this.element.addEventListener("mousedown", this.mousedownWindow.bind(this));
  }
  public async load(element: HTMLElement): Promise<void> {
    const main = document.createElement("div");
    main.style.cssText = `
    width: 100%;
  height: 100%;
  z-index: 1;`;

    if (typeof this.content.load === "function") {
      // main.appendChild(this.content());
      await this.content.load(main);
    } else {
      main.appendChild(this.content);
    }
    const onClose = () => {
      this.onClose(this);
    };
    await this.topbar.load(this.element);
    // this.element.appendChild(topbar({ title: this.title, close: onClose }));
    this.element.appendChild(main);
    // WindowManager.init(this.element);
    super.load(this.desktop.getElement());
    if (this.center) {
      console.log("WIDTH", getWindowWidth());
      this.element.style.left = `${
        getWindowWidth() / 2 - this.dimensions.width / 2
      }px`;
      this.element.style.top = `${
        getWindowHeight() / 2 -
        this.dimensions.height / 2 -
        this.desktop.getTaskbar().getElement().clientHeight
      }px`;
    }
    this.makeMovable();
  }
}
export default OSWindow;
