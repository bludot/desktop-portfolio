import OSElement from "../../utils/OSElement";

class User extends OSElement {
  constructor() {
    super("userinfo", "user-info");
    this.style = () => ({
      [this.id]: {
        borderRadius: "100%",
        position: "relative",
        flex: "1 1 auto",
        margin: "10px 10px"
      }
    });
    const header = document.createElement("h1");
    header.style.cssText = `
      font-size: 34px;
      font-weight: 200;
      white-space: nowrap;
      margin: 5px 0;
      flex: 1 1 auto;
    `;
    header.appendChild(document.createTextNode("James Trotter"));
    const subtitle = document.createElement("sub");

    subtitle.style.cssText = `
      font-size: 16px;
      font-weight: 400;
      white-space: nowrap;
      margin: 5px 0;
      flex: 1 1 auto;
    `;
    subtitle.appendChild(document.createTextNode("Software Engineer"));
    this.element.appendChild(header);
    this.element.appendChild(subtitle);
  }
}

export default User;
