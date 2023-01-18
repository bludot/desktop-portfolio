import OSElement from "../../utils/OSElement";

class SwitchToggle extends OSElement {
  onClick: (e: MouseEvent) => void;
  size: number;
  offColor: string;
  onColor: string;
  value: boolean;
  constructor(
    size: number = 20,
    offColor: string = "#ccc",
    onColor: string = "#2196F3",
    value: boolean = false
  ) {
    super("switch", "switch");
    this.size = size;
    this.onColor = onColor ||"#2196F3";
    this.offColor = offColor ||  "#ccc";
    this.value = value || false;
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    if (this.value) {
      input.checked = true
    }
    const span = document.createElement("span");
    label.appendChild(input);
    label.appendChild(span);
    this.element.appendChild(label);

    this.style = () => ({
      [this.id]: {
        width: `${this.size * 2 + 8}px`,
        height: `${this.size + 8}px`,
        display: "inline-block",
        "& > label": {
          position: "relative",
          display: "inline-block",
          width: "100%",
          "& > input": {
            opacity: 0,
            width: 0,
            height: 0,
            "&:checked + span": {
              backgroundColor: this.onColor,
              "&:before": {
                "-webkit-transform": `translateX(${this.size}px)`,
                "-ms-transform": `translateX(${this.size}px)`,
                transform: `translateX(${this.size}px)`
              }
            },
            "&:focus + span": {
              boxShadow: `0 0 1px ${this.onColor}`
            }
          },
          "& > span": {
            position: "absolute",
            cursor: "pointer",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: this.offColor,
            borderRadius: `${this.size * 2 + 4}px`,
            "-webkit-transition": ".4s",
            transition: ".4s",
            height: `${this.size}px`,
            padding: "4px",
            "&:before": {
              position: "absolute",
              content: "''",
              width: `${this.size}px`,
              height: `${this.size}px`,
              backgroundColor: "white",
              "-webkit-transition": ".4s",
              transition: ".4s",
              borderRadius: "50%"
            }
          }
        }
      }
    });
  }
  async load(element: HTMLElement) {
    super.load(element);
  }
  setOnClick(func: Function) {
    this.element.onclick = func.bind(this)
  }
}

export default SwitchToggle
