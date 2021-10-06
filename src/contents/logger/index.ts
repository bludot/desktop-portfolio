import { GlobalLogger } from "../../Logger";
import { Log } from "../../Logger/Log";
import OSElement from "./../../utils/OSElement";

class LoggerWindow extends OSElement {
  subscriber: any;
  subscribeWindow: HTMLElement;
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
    });
  }
  async beforeLoad() {
    this.element.appendChild(this.subscribeWindow);
    this.subscribe();
  }

  async beforeUnload() {
    this.subscriber.unsubscribe();
  }
}

export default LoggerWindow;
