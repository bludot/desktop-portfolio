import OSElement from "./../../utils/OSElement";
import { space } from "../../theme";
import { observeWidth } from "../../utils/utils";

/** Below this the two-column entry has to stack. */
const NARROW_CONTENT_PX = 480;
import ExperiencesContent from "./experiences";
import experience from "./data";

const content = `
<div>
  <div class="content"></div>
</div>
`;

class ExperienceContent extends OSElement {
  private stopObserving?: () => void;

  constructor() {
    super("experiencecontent", "experience-content");
    const element: HTMLElement = new DOMParser().parseFromString(
      content,
      "text/html"
    ).body.childNodes[0] as HTMLElement;
    const loader = element.querySelector(".content") as HTMLElement
    const experiences: ExperienceContent[] = experience.map(experience => new ExperiencesContent(experience))
    experiences.forEach(experience => experience.load(loader))

    this.element.appendChild(element);
    this.style = () => ({
      [this.id]: {
        padding: `${space.windowPadY} ${space.windowPadX}`,
        display: "block",
        // Set by observeWidth against this window's own width.
        "&.is-narrow": {
          padding: "15px 14px"
        }
      },
    });
  }

  async load(element: HTMLElement) {
    await super.load(element);
    this.stopObserving = observeWidth(this.element, NARROW_CONTENT_PX);
  }

  async unload() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    await super.unload();
  }
}

export default ExperienceContent;
