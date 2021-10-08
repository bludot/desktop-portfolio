interface IShortcut {
  keys: string[];
  action: () => void;
}

class KeyShortcut {
  keysPressed: any;
  shortcuts: IShortcut[];
  constructor(shortcuts?: IShortcut[]) {
    // this.shortcuts = shortcuts;
    this.keysPressed = {}
    window.addEventListener("keydown", this.keydown.bind(this));
    window.addEventListener("keyup", this.keyup.bind(this));
  }
  keydown(e: KeyboardEvent) {
    if (e.key) {
      this.keysPressed[e.key] = 1;
    }
    if (e.keyCode) {
      const char = String.fromCharCode(e.keyCode);
      this.keysPressed[char] = 1;
    }
    console.log(this.keysPressed);
  }
  keyup(e: KeyboardEvent) {
    if (e.key) {
      delete this.keysPressed[e.key];
    }
    if (e.keyCode) {
      const char = String.fromCharCode(e.keyCode);
      delete this.keysPressed[char];
    }
    console.log(this.keysPressed);
  }
}

export { KeyShortcut as default, IShortcut };
