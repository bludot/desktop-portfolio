import OSElement from "../../utils/OSElement";

class Bootlogo extends OSElement {
  canvas: SVGSVGElement;
  path: SVGPathElement;
  constructor() {
    super("Bootlogo", "bootlogo");
    this.style = () => ({
      [this.id]: {
        position: "relative",
        overflow: "hidden",
        opacity: "1",
        flex: "0 1 auto",
        "&::before": {
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
    });
    this.element.innerHTML = `
    <div id="floret_container" style="width:130px;height:130px;">
      <div id="flower" class="on">
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="bottom"></div>
      </div>
    </div>`
  }
  
  
  async beforeUnload() {
    const promise = new Promise((resolve): void => {
      this.element.style.opacity = "0";
      setTimeout(() => {
        resolve(null);
      }, 250);
    });
    return promise;
  }
}

export default Bootlogo;
