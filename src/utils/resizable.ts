import OSElement from "./OSElement";
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
    this.borderWidth = width || 3
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
      overflow: "hidden"
    };
    if (type == ResizeType.TOP) {
      this.style = () => ({
        [this.id]: {
          ...style,
          top: -this.borderWidth,
          left: 0,
          right: 0,
          height: this.borderWidth,
          cursor: "ns-resize"
        }
      });
    } else if (type == ResizeType.RIGHT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          top: 0,
          bottom: 0,
          right: -this.borderWidth,
          width: this.borderWidth,
          cursor: "ew-resize"
        }
      });
    } else if (type == ResizeType.BOTTOM) {
      this.style = () => ({
        [this.id]: {
          ...style,
          bottom: -this.borderWidth,
          right: 0,
          left: 0,
          height: this.borderWidth,
          cursor: "ns-resize"
        }
      });
    } else if (type == ResizeType.LEFT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          bottom: 0,
          top: 0,
          left: -this.borderWidth,
          width: this.borderWidth,
          cursor: "ew-resize"
        }
      });
    } else if (type == ResizeType.BOTTOM_RIGHT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          bottom: -this.borderWidth,
          right: -this.borderWidth,
          width: this.borderWidth,
          height: this.borderWidth,
          cursor: "nwse-resize"
        }
      });
    } else if (type == ResizeType.BOTTOM_LEFT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          bottom: -this.borderWidth,
          left: -this.borderWidth,
          width: this.borderWidth,
          height: this.borderWidth,
          cursor: "nesw-resize"
        }
      });
    } else if (type == ResizeType.TOP_LEFT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          top: -this.borderWidth,
          left: -this.borderWidth,
          width: this.borderWidth,
          height: this.borderWidth,
          cursor: "nwse-resize"
        }
      });
    } else if (type == ResizeType.TOP_RIGHT) {
      this.style = () => ({
        [this.id]: {
          ...style,
          top: -this.borderWidth,
          right: -this.borderWidth,
          width: this.borderWidth,
          height: this.borderWidth,
          cursor: "nesw-resize"
        }
      });
    }
  }
  async load(element: HTMLElement) {
    super.load(element);
    setTimeout(() => {
      this.element.addEventListener("mousedown", this.mouseDown.bind(this));
    }, 0);
  }

  mouseDown(e: MouseEvent) {
    console.log("parent", this.parent);
    this.parentDimensions.width = this.parent.clientWidth;
    this.parentDimensions.height = this.parent.clientHeight;
    this.parentDimensions.x = this.parent.offsetLeft;
    this.parentDimensions.y = this.parent.offsetTop;
    this.cursorPosition.y = e.clientY;
    this.cursorPosition.x = e.clientX;
    const mousemove = this.mouseMove.bind(this);
    window.addEventListener("mousemove", mousemove);
    window.addEventListener("mouseup", (e) => {
      window.removeEventListener("mousemove", mousemove);
    });
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
        this.parent,
        this.parentDimensions.x,
        this.parentDimensions.y,
        this.parentDimensions.width + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height
      );
    } else if (this.type === ResizeType.LEFT) {
      this.updateParentDimensions(
        this.parent,
        this.parentDimensions.x + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.y,
        this.parentDimensions.width - (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height
      );
    } else if (this.type === ResizeType.TOP) {
      this.updateParentDimensions(
        this.parent,
        this.parentDimensions.x,
        this.parentDimensions.y + (e.clientY - this.cursorPosition.y),
        this.parentDimensions.width,
        this.parentDimensions.height - (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.BOTTOM) {
      this.updateParentDimensions(
        this.parent,
        this.parentDimensions.x,
        this.parentDimensions.y,
        this.parentDimensions.width,
        this.parentDimensions.height + (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.BOTTOM_RIGHT) {
      this.updateParentDimensions(
        this.parent,
        this.parentDimensions.x,
        this.parentDimensions.y,
        this.parentDimensions.width + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height + (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.TOP_LEFT) {
      this.updateParentDimensions(
        this.parent,
        this.parentDimensions.x + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.y + (e.clientY - this.cursorPosition.y),
        this.parentDimensions.width - (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height - (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.TOP_RIGHT) {
      this.updateParentDimensions(
        this.parent,
        this.parentDimensions.x,
        this.parentDimensions.y + (e.clientY - this.cursorPosition.y),
        this.parentDimensions.width + (e.clientX - this.cursorPosition.x),
        this.parentDimensions.height - (e.clientY - this.cursorPosition.y)
      );
    } else if (this.type === ResizeType.BOTTOM_LEFT) {
      this.updateParentDimensions(
        this.parent,
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
