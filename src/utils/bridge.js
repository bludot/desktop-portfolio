var Bridge = /** @class */ (function () {
    function Bridge() {
        this.Desktop = null;
    }
    Bridge.prototype.set = function (name, value) {
        if (this[name] === undefined) {
            throw new Error("Not valid");
        }
        this[name] = value;
    };
    Bridge.prototype.get = function (name) {
        if (!this[name]) {
            throw new Error("Not valid");
        }
        return this[name];
    };
    return Bridge;
}());
var bridge = new Bridge();
export default bridge;
//# sourceMappingURL=bridge.js.map