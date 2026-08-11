import App from "../App";
import windowManager from "../../utils/windowManager";
import AboutContent from "../../contents/about";
import Desktop from "../../components/Desktop";
import OSElement from "../../utils/OSElement";
import { color } from "../../theme";
import SwitchToggle from "../../components/SwitchToggle";
import db, {FeatureFlag, FEATURE_FLAG_DEFAULTS} from './../../Store'

class FeatureFlagsApp extends App {
  featureFlags: FeatureFlag[] = []

  constructor(private readonly desktop: Desktop) {
    super("FeatureFlagsApp");
  }

  /**
   * The flags there are, backed by rows for the ones there is no row for yet.
   *
   * Filtered by what the code still knows about rather than returned whole. A
   * flag that has been retired leaves its row behind in everybody's IndexedDB,
   * and listing it would offer a switch that is wired to nothing — which is
   * worse than not offering it, because it looks like it works. `localChat` is
   * the first to go this way; the row stays where it is and is simply not asked
   * about.
   */
  async loadFeatures(): Promise<FeatureFlag[]> {
    const featureFlags = await db.featureFlags.toArray()
    for (const code of Object.keys(FEATURE_FLAG_DEFAULTS)) {
      const isSaved = featureFlags.find((item: FeatureFlag): boolean => {
        return item.code == code
      })
      if (!isSaved) {
        const newFeature = new FeatureFlag(code, FEATURE_FLAG_DEFAULTS[code].name, FEATURE_FLAG_DEFAULTS[code].enabled)
        await newFeature.save()
      }
    }
    const stored = await db.featureFlags.toArray()
    return stored.filter((flag: FeatureFlag) => flag.code in FEATURE_FLAG_DEFAULTS)
  }

  load() {
    this.loadFeatures().then((flags: FeatureFlag[]) => {
      this.featureFlags = flags
      windowManager.new({
        title: this.name,
        content: new FeatureFlagsContent(this.featureFlags),
        desktop: this.desktop
      });
    })

  }
}

class FeatureFlagsContent extends OSElement {
  constructor(featureFlags: FeatureFlag[]) {
    super("FeatureFlagsContent", "feature-flags-content");
    const element: HTMLElement = document.createElement('div')
    for (const flag of featureFlags) {
      const switchToggle = new SwitchToggle(10, undefined, undefined, flag.enabled)
      const container = document.createElement('div')
      const span = document.createElement('span')
      span.appendChild(document.createTextNode(flag.name))
      container.appendChild(span)
      switchToggle.load(container)
      // `this` is the SwitchToggle: setOnClick binds the handler to it.
      switchToggle.setOnClick(function (this: SwitchToggle) {
        flag.enabled = this.element.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked
        flag.save()
      })
      element.appendChild(container)
    }
    this.element.appendChild(element)
    this.style = () => ({
      [this.id]: {
        "& > div > div": {
          height: "20px",
          borderBottom: `1px solid ${color.lineSoft}`,
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
    await super.load(element)
  }
}

export default FeatureFlagsApp
