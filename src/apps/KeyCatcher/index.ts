import App from "../App";

class KeyCatcher extends App {
  sequences: Record<string, () => void>
  static _instance: KeyCatcher

  constructor() {
    super('Keycatcher')
    if (KeyCatcher._instance) {
      return KeyCatcher._instance
    }
    KeyCatcher._instance = this;
    this.sequences = {
      'demo': () => {
        console.log("demo!")
      }
    }
  }

  startListener() {
    keyMapper([this.catchKeys.bind(this)], {
      eventType: 'keydown',
      keystrokeDelay: 400
    });
  }

  catchKeys(sequence) {
    if (this.sequences[sequence.join('')]) {
      this.sequences[sequence.join('')]()
    }

  }
  addSequence(sequence: string, func: () => void) {
    this.sequences[sequence] = func
  }
}

function keyMapper(callbackList, options) {
  const delay = hasProperty('keystrokeDelay', options) && options.keystrokeDelay >= 300 && options.keystrokeDelay;
  const keystrokeDelay = delay || 1000;
  const eventType = hasProperty('eventType', options) && options.eventType || 'keydown';

  let state = {
    buffer: [],
    lastKeyTime: Date.now()
  };

  document.addEventListener(eventType, event => {
    const key = event.key;
    const currentTime = Date.now();
    let buffer = [];

    if (currentTime - state.lastKeyTime > keystrokeDelay) {
      buffer = [key];
    } else {
      buffer = [...state.buffer, key];
    }

    state = {buffer: buffer, lastKeyTime: currentTime};

    callbackList.forEach(callback => callback(buffer));
  });

  function hasProperty(property, object) {
    return object && object.hasOwnProperty(property);
  }
}


export default KeyCatcher
