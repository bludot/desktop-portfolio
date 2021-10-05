import OSElement from "./../../utils/OSElement";

const content = `
<div>
  <h1>Bobet Marely</h1>
</div>
`;

class AboutContent extends OSElement {
  constructor() {
    super("aboutcontent", "about-content");
    const element: HTMLElement = new DOMParser().parseFromString(
      content,
      "text/html"
    ).body.childNodes[0] as HTMLElement;
    this.element.appendChild(element);
    this.style = () => ({
      [this.id]: {}
    });
  }
}

export default AboutContent;
