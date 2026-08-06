import { GlobalLogger } from "../../Logger";
import { Log } from "../../Logger/Log";
import OSElement from "./../../utils/OSElement";
import { overlayScroll } from "../../components/Scrollbar";
import type ScrollBar from "../../components/Scrollbar";

class LoggerWindow extends OSElement {
  subscriber: any;
  subscribeWindow: HTMLElement;
  /*
   * The log scrolls itself rather than letting the window do it, because it is
   * pinned to the newest line — so the bar belongs to this box, not to the
   * window around it.
   */
  private bar?: ScrollBar;
  constructor() {
    super("Logger", "logger");

    this.subscribeWindow = document.createElement("div");
    this.style = () => ({
      [this.id]: {
        position: "relative",
        height: "100%",
        display: "block",
        '& > div': {
          height: "100%",
          overflow: "auto",
        },
        '& span': {
          display: "block"
        }
      },
    });
  }
  private subscribe() {
    this.subscriber = GlobalLogger.getInstance().subscribe('log', (data: Log) => {
      const span = document.createElement('span');
      span.appendChild(document.createTextNode(data.formattedMessage));
      this.subscribeWindow.appendChild(span);
      this.subscribeWindow.scrollTop = this.subscribeWindow.scrollHeight;
      // A line at a time, and the box never changes size, so nothing else would
      // tell the bar that there is more to scroll through than there was.
      this.bar?.sync();
    });
  }
  async beforeLoad() {
    this.element.appendChild(this.subscribeWindow);
    this.subscribe();
  }

  async afterLoad() {
    // The host is named rather than found: window content is loaded before the
    // window itself is on screen, and nothing detached has a computed position
    // to go on. This box is the one that positions everything in here.
    this.bar = overlayScroll(this.subscribeWindow, "y", this.element);
  }

  async beforeUnload() {
    this.subscriber.unsubscribe();
    await this.bar?.unload();
    this.bar = undefined;
  }
}

export default LoggerWindow;
