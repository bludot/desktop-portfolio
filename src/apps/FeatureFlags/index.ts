import App from "../App";
import windowManager from "../../utils/windowManager";
import AboutContent from "../../contents/about";
import bridge from "../../utils/bridge";
import Desktop from "../../components/Desktop";
import OSElement from "../../utils/OSElement";

class FeatureFlags extends App {
  constructor() {
    super("FeatureFlags");
  }

  load() {
    windowManager.new({
      title: this.name,
      content: new AboutContent(),
      desktop: bridge.get<Desktop>("Desktop")
    });
  }
}

class FeatureFlagsContent extends OSElement {
  constructor() {
    super("FeatureFlagsContent", "feature-flags-content");
    const element: HTMLElement = document.createElement('div')

    this.style = () => ({
      [this.id]: {

      }
    });
  }
  async load(element: HTMLElement) {
    super.load(element)
  }
}
