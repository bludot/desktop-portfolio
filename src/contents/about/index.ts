import OSElement from "./../../utils/OSElement";

const content = `
<div>
  <h1>About</h1>
  <h2>Bobet Marely</h2>
  <p>Hello!</p>
  <p>I am a software engineer passionate about technology. You can see my experience by going to the start menu and
  selecting experience</p>
  <h2>About This Project</h2>
  <p>
  This project was created to play around without using any frameworks (old style!) but apply modern patterns we 
  currently use today. You can checkout this project 
  <a target="_blank" href="https://github.com/bludot/desktop-portfolio">Here</a>.
  Since I first started with programming I have had this fascination with the UI of desktop systems. Knowing only PHP, 
  HTML, CSS, and JS at the time I've ventured into building my own such UI on the web and making something of a thin 
  client. This project is basically a revist of this idea just for fun and seeing what I have learned has changed how
  I have created this in the beginning. You can enjoy the horribleness 
  <a target="_blank" href="https://gitlab.com/BludotOS/BludotOS">here</a>. 
  </p>
  
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
      [this.id]: {
        padding: "1em 1em",
        display: "block",
        lineHeight: 1.5,
        "& > div > h1": {
          marginTop: 0
        }
      }
    });
  }
}

export default AboutContent;
