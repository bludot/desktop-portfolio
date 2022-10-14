var KeyShortcut = /** @class */ (function () {
    function KeyShortcut(shortcuts) {
        // this.shortcuts = shortcuts;
        this.keysPressed = {};
        window.addEventListener("keydown", this.keydown.bind(this));
        window.addEventListener("keyup", this.keyup.bind(this));
    }
    KeyShortcut.prototype.keydown = function (e) {
        if (e.key) {
            this.keysPressed[e.key] = 1;
        }
        if (e.keyCode) {
            var char = String.fromCharCode(e.keyCode);
            this.keysPressed[char] = 1;
        }
        console.log(this.keysPressed);
    };
    KeyShortcut.prototype.keyup = function (e) {
        if (e.key) {
            delete this.keysPressed[e.key];
        }
        if (e.keyCode) {
            var char = String.fromCharCode(e.keyCode);
            delete this.keysPressed[char];
        }
        console.log(this.keysPressed);
    };
    return KeyShortcut;
}());
export { KeyShortcut as default };
//# sourceMappingURL=secrets.js.map