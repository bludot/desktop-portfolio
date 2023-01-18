import App from "../App";
import windowManager from "../../utils/windowManager";
import AboutContent from "../../contents/about";
import bridge from "../../utils/bridge";
import Desktop from "../../components/Desktop";
import OSElement from "../../utils/OSElement";
import SwitchToggle from "../../components/SwitchToggle";
import db, {FeatureFlag, IFeatureFlag} from './../../Store'

const flags = {
  "custom_scrollbar": {
    name: "custom scrollbar",
    enabled: false
  }
}

class FeatureFlagsApp extends App {
  featureFlags: FeatureFlag[]

  constructor() {
    super("FeatureFlagsApp");

  }

  async loadFeatures(): Promise<FeatureFlag[]> {
    const featureFlags = await db.featureFlags.toArray()
    for (let feature in flags) {
      const isSaved = featureFlags.find((item: FeatureFlag): boolean => {
        return item.code == feature
      })
      if (!isSaved) {
        const newFeature = new FeatureFlag(feature, flags[feature].name, flags[feature].enabled)
        newFeature.save()
      }
    }
    return db.featureFlags.toArray()
  }

  load() {
    this.loadFeatures().then((flags: FeatureFlag[]) => {
      this.featureFlags = flags
      windowManager.new({
        title: this.name,
        content: new FeatureFlagsContent(this.featureFlags),
        desktop: bridge.get<Desktop>("Desktop")
      });
    })

  }
}

class FeatureFlagsContent extends OSElement {
  constructor(featureFlags: FeatureFlag[]) {
    super("FeatureFlagsContent", "feature-flags-content");
    const element: HTMLElement = document.createElement('div')
    for (let feature in featureFlags) {
      const switchToggle = new SwitchToggle(10, null, null, featureFlags[feature].enabled)
      const container = document.createElement('div')
      const span = document.createElement('span')
      span.appendChild(document.createTextNode(featureFlags[feature].name))
      container.appendChild(span)
      switchToggle.load(container)
      const onclick = function (flag: FeatureFlag): Function {
        return function () {
          flag.enabled = this.element.querySelector('input[type=checkbox]').checked
          flag.save()
        }
      }
      switchToggle.setOnClick(onclick(featureFlags[feature]))
      element.appendChild(container)
    }
    this.element.appendChild(element)
    this.style = () => ({
      [this.id]: {
        "& > div > div": {
          height: "20px",
          borderBottom: "1px solid #ccc",
          display: "flex",
          flexFlow: "row nowrap",
          justifyContent: "space-between",
          margin: "10px",
          alignItems: "center",
          "& > *": {
            flex: "0 1 auto",
          }
        }
      }
    });
  }

  async load(element: HTMLElement) {
    super.load(element)
  }
}

export default FeatureFlagsApp
