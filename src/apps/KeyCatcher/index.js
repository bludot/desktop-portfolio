var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import App from "../App";
var KeyCatcher = /** @class */ (function (_super) {
    __extends(KeyCatcher, _super);
    function KeyCatcher() {
        var _this = _super.call(this, 'Keycatcher') || this;
        if (KeyCatcher._instance) {
            return KeyCatcher._instance;
        }
        KeyCatcher._instance = _this;
        _this.sequences = {
            'demo': function () {
                console.log("demo!");
            }
        };
        return _this;
    }
    KeyCatcher.prototype.startListener = function () {
        keyMapper([this.catchKeys.bind(this)], {
            eventType: 'keydown',
            keystrokeDelay: 400
        });
    };
    KeyCatcher.prototype.catchKeys = function (sequence) {
        if (this.sequences[sequence.join('')]) {
            this.sequences[sequence.join('')]();
        }
    };
    KeyCatcher.prototype.addSequence = function (sequence, func) {
        this.sequences[sequence] = func;
    };
    return KeyCatcher;
}(App));
function keyMapper(callbackList, options) {
    var delay = hasProperty('keystrokeDelay', options) && options.keystrokeDelay >= 300 && options.keystrokeDelay;
    var keystrokeDelay = delay || 1000;
    var eventType = hasProperty('eventType', options) && options.eventType || 'keydown';
    var state = {
        buffer: [],
        lastKeyTime: Date.now()
    };
    document.addEventListener(eventType, function (event) {
        var key = event.key;
        var currentTime = Date.now();
        var buffer = [];
        if (currentTime - state.lastKeyTime > keystrokeDelay) {
            buffer = [key];
        }
        else {
            buffer = __spreadArray(__spreadArray([], state.buffer, true), [key], false);
        }
        state = { buffer: buffer, lastKeyTime: currentTime };
        callbackList.forEach(function (callback) { return callback(buffer); });
    });
    function hasProperty(property, object) {
        return object && object.hasOwnProperty(property);
    }
}
export default KeyCatcher;
//# sourceMappingURL=index.js.map