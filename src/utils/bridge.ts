import Desktop from "./../components/Desktop";

class Bridge {
  Desktop: Desktop;
  constructor() {
    this.Desktop = null;
  }
  set<T>(name: string, value: T) {
    if (this[name] === undefined) {
      throw new Error("Not valid");
    }
    this[name] = value;
  }
  get<T>(name: string): T {
    if (!this[name]) {
      throw new Error("Not valid");
    }
    return this[name];
  }
}

const bridge = new Bridge();

export default bridge;
