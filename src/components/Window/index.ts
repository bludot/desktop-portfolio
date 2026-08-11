import OSElement from "../../utils/OSElement";
import {getWindowWidth, getWindowHeight} from "./../../utils/utils";
import Desktop from "./../Desktop";
import type {IWindow} from "./interfaces";
import TopBar from "./topbar";
import Resizable from "../../utils/resizable";
import { raiseDragShim, dropDragShim } from "../../utils/dragShim";
import { isNarrow } from "../../utils/utils";
import { blur as blurFx, color, radius, shadow } from "../../theme";
import ScrollBar from "../Scrollbar";
import Splash, { resolveSplash } from "../Splash";
import type { SplashfulContent } from "../Splash";
import { motion } from "../../utils/motion";
import { bindContextMenu } from "../ContextMenu";
import type { MenuItem } from "../ContextMenu";
import { windowMenuItems } from "../ContextMenu/menus";

class OSWindow extends OSElement {
  private scrollbar: ScrollBar;
  /** Over the content while it gets ready, when the content asked for one. */
  private splash?: Splash;
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
  /** True when there is not enough width to float a window on a desktop. */
  isMobile: boolean;
  /** Hidden, but still open. The taskbar is the only way back to it. */
  minimized: boolean = false;
  maximized: boolean = false;
  private onChange: () => void = () => undefined;
  private peers: () => OSWindow[] = () => [];
  /** Where the window was before it filled the screen. */
  private restoreBounds?: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
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
                onChange,
                center = true,
                dimensions = {
                  width: 400,
                  height: 400,
                },
                windowPosition,
                peers,
                meta
              }: IWindow) {
    super("window", "window");
    // Width, not user agent: a narrow browser window has the same problem a
    // phone does, and a wide tablet does not.
    this.isMobile = isNarrow()
    this.scrollbar = new ScrollBar();
    this.title = title;
    this.content = content;
    this.desktop = desktop;

    this.onActive = onActive;
    if (onChange) this.onChange = onChange;
    if (peers) this.peers = peers;
    this.onClose = onClose;
    this.center = center;
    this.dimensions = dimensions;
    this.topbar = new TopBar({
      title,
      close: () => void this.requestClose(),
      minimize: () => void this.minimize(),
      maximize: () => this.toggleMaximize(),
      isDialog,
      meta
    });
    this.windowPosition = windowPosition || {}
    this.style = () => ({
      [this.id]: {
        background: this.active ? color.glassWindow : color.glassWindowRest,
        backdropFilter: blurFx.window,
        WebkitBackdropFilter: blurFx.window,
        color: color.ink,
        position: "fixed",
        top: this.windowPosition.top || 0,
        left: this.windowPosition.left || 0,
        height: `${this.dimensions.height}px`,
        width: `${this.dimensions.width}px`,
        ...(this.isMobile ? {} : { borderRadius: radius.window }),
        overflow: "hidden",
        boxShadow: this.active
          ? `${shadow.window}, ${shadow.edge}`
          : `${shadow.windowRest}, ${shadow.edgeRest}`,
        display: "flex",
        flexFlow: "column nowrap",
      },
    });
  }

  /** Close, on its way out rather than all at once. */
  async requestClose(): Promise<void> {
    await motion.windowOut(this.element);
    this.onClose(this);
  }

  /**
   * What this window offers when it is right-clicked.
   *
   * Built here rather than at each surface so the titlebar and the taskbar chip
   * cannot drift apart: they are two ways of pointing at the same window, and
   * they should answer with the same menu.
   */
  menuItems(): MenuItem[] {
    const others = this.peers().filter((peer) => peer !== this);

    return windowMenuItems(
      {
        minimized: this.minimized,
        maximized: this.maximized,
        others: others.length
      },
      {
        show: () => void this.restore(),
        minimize: () => void this.minimize(),
        toggleMaximize: () => {
          // Filling the screen from a chip should also bring the window
          // forward; leaving it behind another one would look like nothing
          // had happened.
          if (!this.maximized) this.onActive(this);
          this.toggleMaximize();
        },
        close: () => void this.requestClose(),
        closeOthers: () => others.forEach((peer) => void peer.requestClose())
      }
    );
  }

  unfocus() {
    this.active = false;
    this.applyStyle();
  }

  focus() {
    this.active = true;
    this.applyStyle();
  }

  /**
   * Out of the way, without closing.
   *
   * The element is hidden rather than unloaded: its content keeps its state —
   * a scrolled README, an open file — and comes back exactly as it was.
   */
  async minimize(): Promise<void> {
    if (this.minimized) return;
    this.minimized = true;
    this.active = false;

    await motion.windowOut(this.element);
    this.element.style.display = "none";
    this.applyStyle();
    this.onChange();
  }

  async restore(): Promise<void> {
    if (!this.minimized) return;
    this.minimized = false;
    this.element.style.display = "";

    this.onActive(this);
    this.onChange();
    await motion.windowIn(this.element);
  }

  /**
   * Fill the desktop, or go back to where it was.
   *
   * The taskbar's own top edge is the floor, so a maximised window never hides
   * the one control that gets you back to the others.
   */
  toggleMaximize(): void {
    if (this.maximized) {
      this.unmaximize();
      return;
    }

    const style = this.element.style;
    this.restoreBounds = {
      left: style.left,
      top: style.top,
      width: style.width,
      height: style.height
    };

    const taskbar = this.desktop.getTaskbar().getElement();
    style.left = "0px";
    style.top = "0px";
    style.width = `${getWindowWidth()}px`;
    style.height = `${taskbar.offsetTop}px`;
    // A drag would otherwise carry the old transform into the new geometry.
    style.transform = "";

    this.maximized = true;
    this.onActive(this);
    this.onChange();
  }

  private unmaximize(): void {
    if (!this.restoreBounds) return;
    const { left, top, width, height } = this.restoreBounds;
    Object.assign(this.element.style, { left, top, width, height });
    this.restoreBounds = undefined;
    this.maximized = false;
    this.onChange();
  }

  setIndex(index: number): void {

    this.element.style.zIndex = index.toString();
  }

  mouseup(e: MouseEvent): void {
    dropDragShim();
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

    /*
     * Cover the screen, now that this is a drag rather than a press.
     *
     * The moves are listened for on `window`, so any cross-origin frame the
     * pointer passes over takes them instead — its own window, its own event
     * loop, nothing forwarded. Dragging a window across an app window used to
     * drop it there, and the release landed in the frame too, leaving the drag
     * running until the next click somewhere else finished it.
     *
     * On the move and not the press, because the titlebar holds the window
     * controls: a sheet raised on mousedown swallowed their release and no
     * click ever reached them.
     */
    raiseDragShim("grabbing");

    /*
     * Dragging a maximised window puts it back first, keeping the cursor at the
     * same point along the titlebar it grabbed.
     *
     * On the first movement, never on the press. A double-click is two presses,
     * so doing this on mousedown meant the second press of a double-click
     * un-maximised the window and the dblclick that followed maximised it
     * straight back — the window could never be restored, and its saved
     * position was overwritten in the process.
     */
    if (this.maximized) {
      // Measured from the press, not from this move: the grab point is where
      // the titlebar was taken hold of, and the window has not shifted since.
      const before = this.element.getBoundingClientRect();
      const grip =
        before.width > 0
          ? (this.dragStart.pointerX - before.left) / before.width
          : 0.5;
      const grabY = this.dragStart.pointerY - before.top;

      this.unmaximize();

      const width = this.element.getBoundingClientRect().width;
      const left = e.pageX - width * grip;
      const top = e.pageY - grabY;
      this.element.style.left = `${left}px`;
      this.element.style.top = `${top}px`;
      this.element.style.transform = "";

      // Start the drag again from where the window has just landed.
      this.dragStart = { pointerX: e.pageX, pointerY: e.pageY, left, top };
      this.dragDelta = { x: 0, y: 0 };
      return;
    }

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
    const titlebar = this.element.querySelector(".topbar-window")!;
    titlebar.addEventListener(
      "mousedown",
      this.onTitlebarMouseDown as EventListener
    );
    // The gesture every desktop has. The buttons sit inside the titlebar, so
    // a double-click on one of them must not also toggle the window.
    titlebar.addEventListener("dblclick", ((e: MouseEvent) => {
      if ((e.target as Element)?.closest("topbar-button")) return;
      this.toggleMaximize();
    }) as EventListener);
    this.element.addEventListener("mousedown", this.onWindowMouseDown);
  }

  public async load(element: HTMLElement): Promise<void> {

    let hasScrollableContent = false;
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

    // Before the content is asked to load, not after: a content that takes a
    // moment to mount is part of what there is to wait for, and a cover that
    // arrives once it has finished has missed the wait it was there for.
    await this.raiseSplash(main);

    if (typeof this.content.load === "function") {

      await this.content.load(main);
      // Content that loads itself is the scrollable kind, so it always gets the
      // overlay scrollbar. Raw nodes are appended as-is and do not scroll.
      this.scrollbar.attachTo(main);
      hasScrollableContent = true;
    } else {
      main.appendChild(this.content);
    }
    const onClose = () => {
      this.onClose(this);
    };
    await this.topbar.load(this.element);

    /*
     * The whole window, not just its titlebar.
     *
     * A right-click should always land on something, and the nearest true
     * answer to "what did I press on?" inside a window is the window itself.
     * The one thing left to the browser is a text field, which `bindContextMenu`
     * excludes everywhere: nothing written here can stand in for paste.
     *
     * Anything not claimed here reaches the desktop's backstop instead, so the
     * gesture is never handed back to the browser by accident.
     */
    bindContextMenu(this.element, () => {
      // Raise it first: a menu is about to describe this window, so it had
      // better be the one in front.
      this.onActive(this);
      return this.menuItems();
    });

    this.element.appendChild(main);

    if (hasScrollableContent) {
      await this.scrollbar.load(this.element);
    }

    await super.load(this.desktop.getElement());
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

    motion.windowIn(this.element);
  }

  /**
   * Cover the content area until the content says it has something to show.
   *
   * The window mounts this rather than each content drawing its own, so every
   * window waits the same way — see `components/Splash`. The default is built
   * from this window's own title, and content that wants something else says
   * only that much; content that says nothing about being ready is taken to be
   * ready, which is true of a page of prose and was true of every window here
   * until apps arrived.
   */
  private async raiseSplash(main: HTMLElement): Promise<void> {
    const content = this.content as SplashfulContent | undefined;
    const spec = resolveSplash(content, this.title);
    const ready = content?.ready;
    if (!spec || !ready) return;

    this.splash = new Splash(spec);
    await this.splash.load(main);

    // Settled either way: a content that gave up has as much to show as one
    // that succeeded — its own account of what went wrong — and either is
    // better than the cover it is under.
    void Promise.resolve(ready)
      .catch(() => undefined)
      .then(() => this.splash?.reveal());
  }

  /**
   * Take the content down with the window.
   *
   * Nothing did this before, so a window closed on an app left its frame
   * fetching a page into an element nobody could see, and a Projects window
   * left an observer watching a node that had gone. The content's own
   * `beforeUnload` is where each of those is already handled — it simply was
   * never called.
   */
  public async beforeUnload(): Promise<void> {
    await super.beforeUnload();

    await this.splash?.dismiss();
    this.splash = undefined;

    const content = this.content as { unload?: () => unknown } | undefined;
    if (typeof content?.unload === "function") await content.unload();
  }

  makeResizable() {
    Resizable(this)
  }
}

export default OSWindow;
