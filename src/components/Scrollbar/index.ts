import debounce from "../../utils/debounce";
import OSElement from "../../utils/OSElement";

class ScrollBar extends OSElement {
  private debounceHide: any;
  constructor() {
    super("scrollbar", "scrollbar");
    const bar = document.createElement("div");
    bar.className = "bar";
    this.element.appendChild(bar);
    this.debounceHide = debounce(this.hide.bind(this), 1000, false);
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

  scroll(e: WheelEvent) {
    this.element.style.right = "0px";
    // @ts-ignore
    const delta = e.wheelDelta / 10;
    const parent = this.element.parentElement;
    parent.scrollTop += -delta;
    const top =
      (parent.scrollTop / parent.clientHeight) *
      this.element.children[0].clientHeight;

    (this.element.children[0] as HTMLElement).style.top = top + "px";
    this.element.style.top = parent.scrollTop + "px";
    this.debounceHide();
  }

  hide() {
    console.log("doing hide");
    this.element.style.right = "-10px";
  }

  async load(element: HTMLElement) {
    super.load(element);
    setTimeout(() => {
      console.log("THE HEIGHT", this.element.parentElement.clientHeight);
      console.log("SCROLL HEIGHT", this.element.parentElement.scrollHeight);
      const height =
        (this.element.parentElement.clientHeight /
          this.element.parentElement.scrollHeight) *
        this.element.parentElement.clientHeight;
      console.log("scrollbar");
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
      this.applyStyle();
      this.element.parentNode?.addEventListener(
        "mousewheel",
        this.scroll.bind(this)
      );
    }, 0);
  }
}

export {ScrollBar as default}
