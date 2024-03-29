import OSElement from "../../utils/OSElement";
import {getWindowWidth, getWindowHeight} from "./../../utils/utils";
import Desktop from "./../Desktop";
import {IWindow} from "./interfaces";
import TopBar from "./topbar";
import WindowBlur from "./blur";
import Resizable from "../../utils/resizable";
import isMobile from 'is-mobile'
import ScrollBar from "../Scrollbar";
import db from "../../Store";

class OSWindow extends OSElement {
  private scrollbar: ScrollBar;
  isDialog: boolean = false;
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
  isMobile: boolean;

  constructor({
                isDialog,
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
                windowPosition
              }: IWindow) {
    super("window", "window");
    this.isMobile = isMobile()
    const blur = new WindowBlur(60, 8);
    this.scrollbar = new ScrollBar();
    blur.load(this.element);
    this.title = title;
    this.content = content;
    this.desktop = desktop;

    this.onActive = onActive;
    this.onClose = onClose;
    this.center = center;
    this.dimensions = dimensions;
    this.topbar = new TopBar({title, close: () => this.onClose(this), isDialog});
    this.windowPosition = windowPosition || {}
    this.style = () => ({
      [this.id]: {
        background: "rgba(200,200,200, .5)",
        position: "fixed",
        top: this.windowPosition.top || 0,
        left: this.windowPosition.left || 0,
        height: `${this.dimensions.height}px`,
        width: `${this.dimensions.width}px`,
        ...(this.isMobile ? {
          } : {
            borderRadius: "8px",
          }
        ),
        // overflow: "hidden",
        // overflow: "auto",
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

    this.element.style.zIndex = index.toString();
  }

  mouseup(e: MouseEvent): void {
    window.removeEventListener("mousemove", this.mousemove.bind(this));
    window.removeEventListener("mouseup", this.mouseup.bind(this));

    this.windowPosition = {};
  }

  mousemove(e: MouseEvent): void {
    e.preventDefault();
    this.element.style.top = e.pageY - this.windowPosition.top + "px";
    this.element.style.left = e.pageX - this.windowPosition.left + "px";
  }

  mousedown(e: MouseEvent): void {


    this.windowPosition = {
      y: e.pageY,
      x: e.pageX,
      top: e.pageY - this.element.offsetTop || e.pageY,
      left: e.pageX - this.element.offsetLeft || e.pageX,
    };

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
    height: auto;
    z-index: 1;
    flex: 1 1 auto;
    overflow: auto;
    position: relative;
    `;
    // overflow: hidden;

    if (typeof this.content.load === "function") {

      await this.content.load(main);
      const scrollbarFeature = await db.featureFlags.where({code: "custom_scrollbar"}).toArray()
      console.log("THE FEATURE", scrollbarFeature)
      if (scrollbarFeature[0]?.enabled) {
        this.scrollbar.load(main);
      }
    } else {
      main.appendChild(this.content);
    }
    const onClose = () => {
      this.onClose(this);
    };
    await this.topbar.load(this.element);

    this.element.appendChild(main);

    super.load(this.desktop.getElement());
    if (this.windowPosition.top) {
      this.element.style.top = this.windowPosition.top
    }
    if (this.windowPosition.left) {
      this.element.style.left = this.windowPosition.left
    }
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
    if (this.isMobile) {
      setTimeout(() => {
        const height = getWindowHeight() - (getWindowHeight() - this.desktop.getTaskbar().getElement().offsetTop)
        this.element.style.left = `0px`;
        this.element.style.top = `0px`;
        this.element.style.height = `${height}px`;
        this.element.style.width = `${getWindowWidth()}px`;
      }, 0)
    }
    if (!this.isMobile) {
      setTimeout(() => {
        this.makeMovable();
        this.makeResizable();
      }, 0)
    }
  }

  makeResizable() {
    Resizable(this)
  }
}

export default OSWindow;
