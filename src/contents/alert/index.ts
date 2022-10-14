import OSElement from "./../../utils/OSElement";

const content = ({title, text}) => `
<div>
  <h1>${title}</h1>
  <div class="content">
    <p>${text}</p>
    </div>
</div>
`;

class AlertContent extends OSElement {
  constructor({title, text}) {
    super("alert", "alert-content");
    const element: HTMLElement = new DOMParser().parseFromString(
      content({title, text}),
      "text/html"
    ).body.childNodes[0] as HTMLElement;
    const loader = element.querySelector(".content") as HTMLElement


    this.element.appendChild(element);
    this.style = () => ({
      [this.id]: {
        padding: "1em 1em",
        display: "block",
        "& > div > h1": {
          marginTop: 0
        }
      },

    });
  }
}

export default AlertContent;
