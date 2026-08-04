import App from "../App";
import Logger from "../../Logger";
import FeatureFlagsApp from "../FeatureFlags";
import type Desktop from "../../components/Desktop";

const logger = new Logger("KeyCatcher");

class KeyCatcher extends App {
  sequences: Record<string, () => void> = {}
  static _instance: KeyCatcher

  desktop!: Desktop

  constructor(desktop: Desktop) {
    super('Keycatcher')
    if (KeyCatcher._instance) {
      return KeyCatcher._instance
    }
    KeyCatcher._instance = this;
    this.desktop = desktop;
    this.sequences = {
      'demo': () => {
        logger.info("demo!")
      },
      "feature": () => {
        new FeatureFlagsApp(this.desktop).load()
      }
    }
  }

  startListener() {
    keyMapper([this.catchKeys.bind(this)], {
      eventType: 'keydown',
      keystrokeDelay: 400
    });
  }

  catchKeys(sequence: string[]) {
    if (this.sequences[sequence.join('')]) {
      this.sequences[sequence.join('')]()
    }

  }
  addSequence(sequence: string, func: () => void) {
    this.sequences[sequence] = func
  }
}

function keyMapper(
  callbackList: Array<(buffer: string[]) => void>,
  options: { eventType?: string; keystrokeDelay?: number }
) {
  const requested = options?.keystrokeDelay;
  const keystrokeDelay = requested !== undefined && requested >= 300 ? requested : 1000;
  const eventType = options?.eventType || 'keydown';

  let state: { buffer: string[]; lastKeyTime: number } = {
    buffer: [],
    lastKeyTime: Date.now()
  };

  document.addEventListener(eventType, (event: Event) => {
    const key = (event as KeyboardEvent).key;
    const currentTime = Date.now();
    let buffer: string[] = [];

    if (currentTime - state.lastKeyTime > keystrokeDelay) {
      buffer = [key];
    } else {
      buffer = [...state.buffer, key];
    }

    state = {buffer: buffer, lastKeyTime: currentTime};

    callbackList.forEach(callback => callback(buffer));
  });

}


export default KeyCatcher
