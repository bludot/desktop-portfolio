import OSElement from "../../utils/OSElement";
import Loader from "../Loader";
import Bootlogo from "./bootlogo";

class Bootscreen extends OSElement {
  loader: Loader;
  canvas: SVGSVGElement;
  path: SVGPathElement;
  bootlogo: Bootlogo;
  constructor() {
    super("Bootscreen", "bootscreen");
    this.style = () => ({
      [this.id]: {
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: "9999",
        overflow: "hidden",
        opacity: "1",
        transition: "250ms opacity linear",
        background: "#EEEE",
        display: "flex",
        flexFlow: "column",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        "&::before": {
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
    });
    this.bootlogo = new Bootlogo();
    this.loader = new Loader();
  }
  async beforeLoad() {
    await this.bootlogo.load(this.element);
    await this.loader.load(this.element);
    console.log('here1')
  }
  
  
  async beforeUnload() {
    console.log('here')
    const promise = new Promise((resolve): void => {
      this.element.style.opacity = "0";
      setTimeout(() => {
        resolve(null);
      }, 250);
    });
    return promise;
  }
}

export default Bootscreen;
