import OSElement from "../../utils/OSElement";
import {getWindowWidth, getWindowHeight} from "./../../utils/utils";
import Desktop from "./../Desktop";
import type {IWindow} from "./interfaces";
import TopBar from "./topbar";
import WindowBlur from "./blur";
import Resizable from "../../utils/resizable";
import isMobile from 'is-mobile'
import ScrollBar from "../Scrollbar";
import { isFeatureEnabled } from "../../Store";

class OSWindow extends OSElement {
  private scrollbar: ScrollBar;
  private scrollbarWanted = false;
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
  // Bound once at construction: .bind() returns a new function on every call,
  // so binding inline would give removeEventListener a reference that never
  // matches what addEventListener registered.
  private readonly onMouseMove = this.mousemove.bind(this);
  private readonly onMouseUp = this.mouseup.bind(this);
  private readonly onTitlebarMouseDown = this.mousedown.bind(this);
  private readonly onWindowMouseDown = this.mousedownWindow.bind(this);
  // Drag state: the pointer and box position at press, and the offset since.
  private dragStart = { pointerX: 0, pointerY: 0, left: 0, top: 0 };
  private dragDelta = { x: 0, y: 0 };

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
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);

    // Bake the transform back into top/left. Everything else — resizing,
    // centring, the mobile layout — reads offsetLeft/offsetTop, so those have
    // to stay authoritative once the drag ends.
    this.element.style.transform = "";
    this.element.style.willChange = "";
    this.element.style.left = `${this.dragStart.left + this.dragDelta.x}px`;
    this.element.style.top = `${this.dragStart.top + this.dragDelta.y}px`;

    this.windowPosition = {};
  }

  mousemove(e: MouseEvent): void {
    e.preventDefault();

    this.dragDelta = {
      x: e.pageX - this.dragStart.pointerX,
      y: e.pageY - this.dragStart.pointerY,
    };

    // Written synchronously, not deferred to requestAnimationFrame. Chrome
    // already delivers mousemove aligned to the frame, so batching would only
    // push the write into the *next* frame — a fixed delay, which is why the
    // window trailed further the faster you moved. The write costs ~0.002ms, so
    // there is nothing worth batching away.
    //
    // translate3d rather than top/left: the compositor can apply a transform
    // without a layout and paint pass, which is the part that actually costs.
    this.element.style.transform =
      `translate3d(${this.dragDelta.x}px, ${this.dragDelta.y}px, 0)`;
  }

  mousedown(e: MouseEvent): void {
    // Without this the browser starts a text selection at the press point and
    // extends it as the window moves, so dragging a titlebar highlights
    // whatever the pointer passes over. Only the titlebar is suppressed —
    // window content stays selectable.
    e.preventDefault();

    this.windowPosition = {
      y: e.pageY,
      x: e.pageX,
      top: e.pageY - this.element.offsetTop || e.pageY,
      left: e.pageX - this.element.offsetLeft || e.pageX,
    };

    this.dragStart = {
      pointerX: e.pageX,
      pointerY: e.pageY,
      left: this.element.offsetLeft,
      top: this.element.offsetTop,
    };
    this.dragDelta = { x: 0, y: 0 };
    // Promote the layer before the first move rather than on it.
    this.element.style.willChange = "transform";

    this.onActive(this);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
  }

  mousedownWindow() {
    this.onActive(this);
  }

  public makeMovable(): void {
    this.element
      .querySelector(".topbar-window")!
      .addEventListener("mousedown", this.onTitlebarMouseDown as EventListener);
    this.element.addEventListener("mousedown", this.onWindowMouseDown);
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
      if (await isFeatureEnabled("custom_scrollbar")) {
        this.scrollbar.attachTo(main);
        this.scrollbarWanted = true;
      }
    } else {
      main.appendChild(this.content);
    }
    const onClose = () => {
      this.onClose(this);
    };
    await this.topbar.load(this.element);

    this.element.appendChild(main);

    if (this.scrollbarWanted) {
      await this.scrollbar.load(this.element);
    }

    super.load(this.desktop.getElement());
    if (this.windowPosition.top) {
      this.element.style.top = this.windowPosition.top
    }
    if (this.windowPosition.left) {
      this.element.style.left = this.windowPosition.left
    }
    if (this.center) {
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
