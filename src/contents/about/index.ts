import OSElement from "./../../utils/OSElement";
import { color, font, size, space, tracking, weight } from "../../theme";

/**
 * Structure follows the mockup — name, role, lead, rule, stack — but the words
 * are James's own. The stack chips are pulled from the roles listed in
 * Experience rather than invented.
 */
const stack = [
  "Kafka",
  "Terraform",
  "GraphQL",
  "AWS",
  "Databricks",
  "Kubernetes"
];

const content = `
<div>
  <h2 class="about-name">James Trotter</h2>
  <p class="about-role">Software engineer</p>
  <p class="about-lead">I am a software engineer passionate about technology. You can see my
  experience by going to the start menu and selecting experience.</p>

  <div class="about-rule"></div>
  <div class="about-stack">${stack
    .map((item) => `<span>${item}</span>`)
    .join("")}</div>

  <div class="about-rule"></div>
  <h3 class="about-sub">About this project</h3>
  <p class="about-body">
  This project was created to play around without using any frameworks (old
  style!) but apply modern patterns we currently use today. You can checkout
  this project <a target="_blank" href="https://github.com/bludot/desktop-portfolio">here</a>.
  Since I first started with programming I have had this fascination with the UI
  of desktop systems. Knowing only PHP, HTML, CSS, and JS at the time I've
  ventured into building my own such UI on the web and making something of a
  thin client. This project is basically a revisit of this idea just for fun and
  seeing how what I have learned has changed how I build it. You can enjoy the
  horribleness <a target="_blank" href="https://gitlab.com/BludotOS/BludotOS">here</a>.
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
        padding: `${space.windowPadY} ${space.windowPadX}`,
        display: "block",
        fontFamily: font.ui,
        color: color.ink,
        "& .about-name": {
          margin: "0",
          fontSize: size.display,
          fontWeight: weight.announce,
          letterSpacing: tracking.display,
          lineHeight: 1.15
        },
        // The one accent use in this window.
        "& .about-role": {
          margin: "5px 0 13px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.accent
        },
        "& .about-lead": {
          margin: "0",
          fontSize: size.body,
          lineHeight: 1.62,
          color: color.inkSoft,
          maxWidth: "40ch"
        },
        "& .about-rule": {
          height: "1px",
          background: color.line,
          margin: "15px 0 13px"
        },
        "& .about-stack": {
          display: "flex",
          flexWrap: "wrap",
          gap: "5px"
        },
        "& .about-stack > span": {
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: ".03em",
          color: color.inkSoft,
          background: "rgba(255,255,255,.5)",
          border: `1px solid ${color.lineSoft}`,
          borderRadius: "5px",
          padding: "2px 7px"
        },
        "& .about-sub": {
          margin: "0 0 7px",
          fontSize: size.heading,
          fontWeight: weight.announce,
          letterSpacing: tracking.heading
        },
        "& .about-body": {
          margin: "0",
          fontSize: size.bodyTight,
          lineHeight: 1.62,
          color: color.inkSoft
        },
        "& a": {
          color: color.ink,
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          textDecorationColor: color.inkFaint
        },
        "& a:hover": { textDecorationColor: color.ink }
      }
    });
  }
}

export default AboutContent;
