import debounce from "../../utils/debounce";
import OSElement from "../../utils/OSElement";
import normalizeWheel from "../../utils/UniversalScroll/NormalizeWheel";

const flickThreshold = 100;

const animateScroll = (container: HTMLElement, endY: number, duration: number) => {
  const startY = container.scrollTop;
  const distanceY = endY - startY;
  let startTime = null;

  const animate = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutQuad(timeElapsed, startY, distanceY, duration);
    container.scrollTop = run;
    if (timeElapsed < duration) requestAnimationFrame(animate);
  };

  const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  };

  requestAnimationFrame(animate);
};

class ScrollBar extends OSElement {
  private scrollHeight: number;
  private debounceHide: any;
  private touchStartY: number;
  private touchMoveY: number;
  private touchDelta: number;
  private scrollTop: number;
  constructor() {
    super("scrollbar", "scrollbar");
    const bar = document.createElement("div");
    bar.className = "bar";
    this.element.appendChild(bar);
    this.debounceHide = debounce(this.hide.bind(this), 1000, false);
    this.scrollHeight = 0;
    this.style = () => ({
      [this.id]: {
        position: "absolute",
        top: 0,
        right: 0,
        width: "10px",
        zIndex: "1",
        "& > .bar": {
          position: "relative",
          width: "10px",
          backgroundColor: "#ccc"
        }
      }
    });
  }
  // add touch events
  touchStart(e: TouchEvent) {
    this.element.style.right = "0px";
    const parent = this.element.parentElement;
    this.touchStartY = e.touches[0].clientY;
    this.scrollTop = parent.scrollTop
    
  }

  touchMove(e: TouchEvent) {
    e.preventDefault();
    this.touchMoveY = e.touches[0].clientY;
    this.touchDelta = this.touchStartY - this.touchMoveY;

    const parent = this.element.parentElement;
    const top =
      (parent.scrollTop / parent.clientHeight) *
      this.element.children[0].clientHeight;
    this.debounceHide();

    if (
      top > this.scrollHeight - parent?.clientHeight &&
      this.touchDelta > 1
    ) {
      return;
    }

    parent.scrollTop = this.scrollTop + this.touchDelta;

    (this.element.children[0] as HTMLElement).style.top = top + "px";
    this.element.style.top = parent.scrollTop + "px";
  }
  touchEnd(e: TouchEvent) {
    var touch = e.changedTouches[0];
    // var endX = touch.clientX;
    var endY = touch.clientY;
    // var deltaX = endX - startX;
    var deltaY = endY - this.touchStartY;
    // if (Math.abs(deltaX) > flickThreshold || Math.abs(deltaY) > flickThreshold) {
    //   // Handle the flick event
    //  this.handleFlick(deltaX, deltaY);
    // }
    if (Math.abs(deltaY) > flickThreshold) {
      // Handle the flick event
     //this.handleFlick(deltaY);
    }
    this.debounceHide();
  }
  handleFlick( deltaY: number) {
    console.log("flick");
    const parent = this.element.parentElement;
    let flickDirection: string;
        if (deltaY > 0) {
            flickDirection = "down";
        } else {
            flickDirection = "up";
        }
        // perform some action based on the flick direction
        switch (flickDirection) {
            case "up":
              animateScroll(parent, -deltaY, 200);
                console.log("flick up detected");

                break;
            case "down":
              animateScroll(parent, deltaY, 200);
                break;
        }
  }
  
  scroll(e: WheelEvent) {
    this.element.style.right = "0px";
    // @ts-ignore
    const deltas = normalizeWheel(e);
    const delta = deltas.pixelY;
    const parent = this.element.parentElement;
    parent.scrollTop += delta;
    const top =
      (parent.scrollTop / parent.clientHeight) *
      this.element.children[0].clientHeight;
    if (
      top > this.scrollHeight - parent?.clientHeight &&
      delta > 1
    ) {
      return;
    }
    (this.element.children[0] as HTMLElement).style.top = top + "px";
    this.element.style.top = parent.scrollTop + "px";
    this.debounceHide();
    const height =
      (this.element.parentElement.clientHeight /
        this.element.parentElement.scrollHeight) *
      this.element.parentElement.clientHeight;
    this.style = () => ({
      [this.id]: {
        position: "absolute",
        top: 0,
        height: this.element.parentElement?.clientHeight + "px",
        right: "-10px",
        width: "10px",
        zIndex: "1",
        transition: "right 250ms",
        "& > .bar": {
          width: "10px",
          height: height + "px",
          position: "relative",
          backgroundColor: "#ccc"
        }
        // overflow: "hidden"
      }
    });
    this.applyStyle()

  }

  hide() {
    console.log("doing hide");
    this.element.style.right = "-10px";
  }

  async load(element: HTMLElement) {
    super.load(element);
    setTimeout(() => {
      const height =
        (this.element.parentElement.clientHeight /
          this.element.parentElement.scrollHeight) *
        this.element.parentElement.clientHeight;
      this.element.parentElement.style.overflow = "hidden"
      this.style = () => ({
        [this.id]: {
          position: "absolute",
          top: 0,
          height: this.element.parentElement?.clientHeight + "px",
          right: "-10px",
          width: "10px",
          zIndex: "1",
          transition: "right 250ms",
          "& > .bar": {
            width: "10px",
            height: height + "px",
            position: "relative",
            backgroundColor: "#ccc"
          }
          // overflow: "hidden"
        }
      });
      this.scrollHeight = this.element.parentElement.scrollHeight;
      this.applyStyle();
      this.element.parentNode?.addEventListener(
        "mousewheel",
        this.scroll.bind(this)
      );
      // listener for touch events
      this.element.parentNode?.addEventListener(
        "touchstart",
        this.touchStart.bind(this)
      );
      this.element.parentNode?.addEventListener(
        "touchmove",
        this.touchMove.bind(this)
      );
      this.element.parentNode?.addEventListener(
        "touchend",
        this.touchEnd.bind(this)
      );

    }, 0);
  }
}

export { ScrollBar as default }
