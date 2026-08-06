import OSElement from "./OSElement";
import { raiseDragShim, dropDragShim } from "./dragShim";
class ResizableBorder extends OSElement {
  borderWidth: number
  type: ResizeType;
  parentDimensions: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  cursorPosition: {
    x: number;
    y: number;
  };
  constructor(type: ResizeType, width?: number) {
    super("border", "border");
    this.element.className = "border";
    this.type = type;
    /*
     * Inside the window, not hanging off it.
     *
     * These used to sit at negative offsets, just outside the border box —
     * which the window then clipped away with `overflow: hidden`, so no cursor
     * could ever reach one. Grabbing an edge hit the desktop behind it and
     * resizing did nothing at all.
     */
    this.borderWidth = width || 6
    this.parentDimensions = {
      width: 0,
      height: 0,
      x: 0,
      y: 0
    };
    this.cursorPosition = {
      x: 0,
      y: 0
    };
    const style = {
      position: "absolute",
      zIndex: "1",
      overflow: "hidden",
      // Resize handles are grab targets, never text.
      userSelect: "none",
      // Read from one place, because the shim raised for the drag has to show
      // the same one — an edge whose cursor changed as soon as the pointer left
      // its 6px would say the resize had stopped while it was still going.
      cursor: CURSORS[type]
    };
    if (type == ResizeType.TOP) {
      this.style = () => ({
        [this.id]: {
          ...style,
          top: 0,
          left: 0,
          right: 0,
          height: this.borderWidth
        }
      });
    } else if (type == ResizeType.RIGHT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          top: 0,
          bottom: 0,
          right: 0,
          width: this.borderWidth
        }
      });
    } else if (type == ResizeType.BOTTOM) {
      this.style = () => ({
        [this.id]: {
          ...style,
          bottom: 0,
          right: 0,
          left: 0,
          height: this.borderWidth
        }
      });
    } else if (type == ResizeType.LEFT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          bottom: 0,
          top: 0,
          left: 0,
          width: this.borderWidth
        }
      });
    } else if (type == ResizeType.BOTTOM_RIGHT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          bottom: 0,
          right: 0,
          width: this.borderWidth,
          height: this.borderWidth
        }
      });
    } else if (type == ResizeType.BOTTOM_LEFT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          bottom: 0,
          left: 0,
          width: this.borderWidth,
          height: this.borderWidth
        }
      });
    } else if (type == ResizeType.TOP_LEFT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          top: 0,
          left: 0,
          width: this.borderWidth,
          height: this.borderWidth
        }
      });
    } else if (type == ResizeType.TOP_RIGHT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          top: 0,
          right: 0,
          width: this.borderWidth,
          height: this.borderWidth
        }
      });
    }
  }
  async load(element: HTMLElement) {
    await super.load(element);
    setTimeout(() => {
      this.element.addEventListener("mousedown", this.mouseDown.bind(this));
    }, 0);
  }

  /** The element being resized. Only read from handlers wired in load(). */
  private get resizeTarget(): HTMLElement {
    return this.parent as HTMLElement;
  }

  mouseDown(e: MouseEvent) {
    // Same reason as the titlebar: stop the browser starting a selection that
    // would then be dragged across the page while resizing.
    e.preventDefault();

    this.parentDimensions.width = this.resizeTarget.clientWidth;
    this.parentDimensions.height = this.resizeTarget.clientHeight;
    this.parentDimensions.x = this.resizeTarget.offsetLeft;
    this.parentDimensions.y = this.resizeTarget.offsetTop;
    this.cursorPosition.y = e.clientY;
    this.cursorPosition.x = e.clientX;
    /*
     * Cover the screen before the first move.
     *
     * A window holding an app is a window holding a cross-origin frame, and
     * the moves that do the resizing are delivered to `window` here. Drag an
     * edge far enough that the pointer crosses that frame and the events go to
     * the frame's document instead: the window stops resizing halfway through,
     * and the release is swallowed too, so the drag never ends.
     */
    raiseDragShim(CURSORS[this.type]);
    // Both handlers are removed on release. The previous version registered a
    // fresh anonymous mouseup listener per drag and never took it off, so every
    // resize left one behind for the life of the page.
    const mousemove = this.mouseMove.bind(this);
    const mouseup = () => {
      dropDragShim();
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("mouseup", mouseup);
    };
    window.addEventListener("mousemove", mousemove);
    window.addEventListener("mouseup", mouseup);
  }

  updateParentDimensions(
    element: HTMLElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    element.style.top = `${y}px`;
    element.style.left = `${x}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
  }

  mouseMove(e: MouseEvent) {
    e.preventDefault();
    if (this.type === ResizeType.RIGHT) {
      this.updateParentDimensions(
        this.resizeTarget,
        this.parentDimensions.x,
        this.parentDimensions.y,
        this.parentDimensions.width + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height
      );
    } else if (this.type === ResizeType.LEFT) {
      this.updateParentDimensions(
        this.resizeTarget,
        this.parentDimensions.x + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.y,
        this.parentDimensions.width - (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height
      );
    } else if (this.type === ResizeType.TOP) {
      this.updateParentDimensions(
        this.resizeTarget,
        this.parentDimensions.x,
        this.parentDimensions.y + (e.clientY - this.cursorPosition.y),
        this.parentDimensions.width,
        this.parentDimensions.height - (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.BOTTOM) {
      this.updateParentDimensions(
        this.resizeTarget,
        this.parentDimensions.x,
        this.parentDimensions.y,
        this.parentDimensions.width,
        this.parentDimensions.height + (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.BOTTOM_RIGHT) {
      this.updateParentDimensions(
        this.resizeTarget,
        this.parentDimensions.x,
        this.parentDimensions.y,
        this.parentDimensions.width + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height + (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.TOP_LEFT) {
      this.updateParentDimensions(
        this.resizeTarget,
        this.parentDimensions.x + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.y + (e.clientY - this.cursorPosition.y),
        this.parentDimensions.width - (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height - (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.TOP_RIGHT) {
      this.updateParentDimensions(
        this.resizeTarget,
        this.parentDimensions.x,
        this.parentDimensions.y + (e.clientY - this.cursorPosition.y),
        this.parentDimensions.width + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height - (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.BOTTOM_LEFT) {
      this.updateParentDimensions(
        this.resizeTarget,
        this.parentDimensions.x + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.y,
        this.parentDimensions.width - (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height + (e.clientY - this.cursorPosition.y)
      );
    }
  }
}

enum ResizeType {
  TOP_RIGHT = "topright",
  TOP_LEFT = "topleft",
  BOTTOM_RIGHT = "bottomright",
  BOTTOM_LEFT = "bottomleft",
  TOP = "top",
  LEFT = "left",
  RIGHT = "right",
  BOTTOM = "bottom"
}

/** What each edge shows at rest, and what the shim holds during its drag. */
const CURSORS: Record<ResizeType, string> = {
  [ResizeType.TOP]: "ns-resize",
  [ResizeType.BOTTOM]: "ns-resize",
  [ResizeType.LEFT]: "ew-resize",
  [ResizeType.RIGHT]: "ew-resize",
  [ResizeType.TOP_LEFT]: "nwse-resize",
  [ResizeType.BOTTOM_RIGHT]: "nwse-resize",
  [ResizeType.TOP_RIGHT]: "nesw-resize",
  [ResizeType.BOTTOM_LEFT]: "nesw-resize"
};

function Resizeable(element: OSElement) {
  //setTimeout(function () {

  const topBorder = new ResizableBorder(ResizeType.TOP);
  topBorder.load(element.element);
  const rightBorder = new ResizableBorder(ResizeType.RIGHT);
  rightBorder.load(element.element);
  const bottomBorder = new ResizableBorder(ResizeType.BOTTOM);
  bottomBorder.load(element.element);
  const leftBorder = new ResizableBorder(ResizeType.LEFT);
  leftBorder.load(element.element);
  const bottomRightBorder = new ResizableBorder(ResizeType.BOTTOM_RIGHT);
  bottomRightBorder.load(element.element);
  const bottomLeftBorder = new ResizableBorder(ResizeType.BOTTOM_LEFT);
  bottomLeftBorder.load(element.element);
  const topLeftBorder = new ResizableBorder(ResizeType.TOP_LEFT);
  topLeftBorder.load(element.element);
  const topRightBorder = new ResizableBorder(ResizeType.TOP_RIGHT);
  topRightBorder.load(element.element);

}


export default Resizeable
