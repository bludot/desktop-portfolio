import OSElement from "./../../utils/OSElement";

const content = ({title, text}: { title: string; text: string }) => `
<div>
  <h1>${title}</h1>
  <div class="content">
    <p>${text}</p>
    </div>
</div>
`;

class AlertContent extends OSElement {
  constructor({title, text}: { title: string; text: string }) {
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
        },
        /*
         * The last paragraph's bottom margin, which is not space inside this
         * box — it is space after the text, and there is nothing after it.
         *
         * It cannot collapse away either: it escapes the inner div, which has
         * no padding or border to stop it, and then meets this box's padding,
         * which does. So it lands as a real 14px at the bottom, and a dialog
         * sized to its content overflows by exactly that and grows a scrollbar
         * with nothing to scroll to. The top margin above is zeroed for the
         * same reason; this is the other end of it.
         */
        "& p:last-child": {
          marginBottom: 0
        }
      },

    });
  }
}

export default AlertContent;
