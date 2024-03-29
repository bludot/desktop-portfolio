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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import debounce from "../../utils/debounce";
import OSElement from "../../utils/OSElement";
import normalizeWheel from "../../utils/UniversalScroll/NormalizeWheel";
var flickThreshold = 100;
var animateScroll = function (container, endY, duration) {
    var startY = container.scrollTop;
    var distanceY = endY - startY;
    var startTime = null;
    var animate = function (currentTime) {
        if (startTime === null)
            startTime = currentTime;
        var timeElapsed = currentTime - startTime;
        var run = easeInOutQuad(timeElapsed, startY, distanceY, duration);
        container.scrollTop = run;
        if (timeElapsed < duration)
            requestAnimationFrame(animate);
    };
    var easeInOutQuad = function (t, b, c, d) {
        t /= d / 2;
        if (t < 1)
            return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
    };
    requestAnimationFrame(animate);
};
var ScrollBar = /** @class */ (function (_super) {
    __extends(ScrollBar, _super);
    function ScrollBar() {
        var _this = _super.call(this, "scrollbar", "scrollbar") || this;
        var bar = document.createElement("div");
        bar.className = "bar";
        _this.element.appendChild(bar);
        _this.debounceHide = debounce(_this.hide.bind(_this), 1000, false);
        _this.scrollHeight = 0;
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "10px",
                    zIndex: "1",
                    "& > .bar": {
                        position: "relative",
                        width: "10px",
                        backgroundColor: "#ccc"
                    }
                },
                _a);
        };
        return _this;
    }
    // add touch events
    ScrollBar.prototype.touchStart = function (e) {
        this.element.style.right = "0px";
        var parent = this.element.parentElement;
        this.touchStartY = e.touches[0].clientY;
        this.scrollTop = parent.scrollTop;
    };
    ScrollBar.prototype.touchMove = function (e) {
        e.preventDefault();
        this.touchMoveY = e.touches[0].clientY;
        this.touchDelta = this.touchStartY - this.touchMoveY;
        var parent = this.element.parentElement;
        var top = (parent.scrollTop / parent.clientHeight) *
            this.element.children[0].clientHeight;
        this.debounceHide();
        if (top > this.scrollHeight - (parent === null || parent === void 0 ? void 0 : parent.clientHeight) &&
            this.touchDelta > 1) {
            return;
        }
        parent.scrollTop = this.scrollTop + this.touchDelta;
        this.element.children[0].style.top = top + "px";
        this.element.style.top = parent.scrollTop + "px";
    };
    ScrollBar.prototype.touchEnd = function (e) {
        var touch = e.changedTouches[0];
        // var endX = touch.clientX;
        var endY = touch.clientY;
        // var deltaX = endX - startX;
        var deltaY = endY - this.touchStartY;
        // if (Math.abs(deltaX) > flickThreshold || Math.abs(deltaY) > flickThreshold) {
        //   // Handle the flick event
        //  this.handleFlick(deltaX, deltaY);
        // }
        if (Math.abs(deltaY) > flickThreshold) {
            // Handle the flick event
            //this.handleFlick(deltaY);
        }
        this.debounceHide();
    };
    ScrollBar.prototype.handleFlick = function (deltaY) {
        console.log("flick");
        var parent = this.element.parentElement;
        var flickDirection;
        if (deltaY > 0) {
            flickDirection = "down";
        }
        else {
            flickDirection = "up";
        }
        // perform some action based on the flick direction
        switch (flickDirection) {
            case "up":
                animateScroll(parent, -deltaY, 200);
                console.log("flick up detected");
                break;
            case "down":
                animateScroll(parent, deltaY, 200);
                break;
        }
    };
    ScrollBar.prototype.scroll = function (e) {
        var _this = this;
        this.element.style.right = "0px";
        // @ts-ignore
        var deltas = normalizeWheel(e);
        var delta = deltas.pixelY;
        var parent = this.element.parentElement;
        parent.scrollTop += delta;
        var top = (parent.scrollTop / parent.clientHeight) *
            this.element.children[0].clientHeight;
        if (top > this.scrollHeight - (parent === null || parent === void 0 ? void 0 : parent.clientHeight) &&
            delta > 1) {
            return;
        }
        this.element.children[0].style.top = top + "px";
        this.element.style.top = parent.scrollTop + "px";
        this.debounceHide();
        var height = (this.element.parentElement.clientHeight /
            this.element.parentElement.scrollHeight) *
            this.element.parentElement.clientHeight;
        this.style = function () {
            var _a;
            var _b;
            return (_a = {},
                _a[_this.id] = {
                    position: "absolute",
                    top: 0,
                    height: ((_b = _this.element.parentElement) === null || _b === void 0 ? void 0 : _b.clientHeight) + "px",
                    right: "-10px",
                    width: "10px",
                    zIndex: "1",
                    transition: "right 250ms",
                    "& > .bar": {
                        width: "10px",
                        height: height + "px",
                        position: "relative",
                        backgroundColor: "#ccc"
                    }
                    // overflow: "hidden"
                },
                _a);
        };
        this.applyStyle();
    };
    ScrollBar.prototype.hide = function () {
        console.log("doing hide");
        this.element.style.right = "-10px";
    };
    ScrollBar.prototype.load = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _super.prototype.load.call(this, element);
                setTimeout(function () {
                    var _a, _b, _c, _d;
                    var height = (_this.element.parentElement.clientHeight /
                        _this.element.parentElement.scrollHeight) *
                        _this.element.parentElement.clientHeight;
                    _this.element.parentElement.style.overflow = "hidden";
                    _this.style = function () {
                        var _a;
                        var _b;
                        return (_a = {},
                            _a[_this.id] = {
                                position: "absolute",
                                top: 0,
                                height: ((_b = _this.element.parentElement) === null || _b === void 0 ? void 0 : _b.clientHeight) + "px",
                                right: "-10px",
                                width: "10px",
                                zIndex: "1",
                                transition: "right 250ms",
                                "& > .bar": {
                                    width: "10px",
                                    height: height + "px",
                                    position: "relative",
                                    backgroundColor: "#ccc"
                                }
                                // overflow: "hidden"
                            },
                            _a);
                    };
                    _this.scrollHeight = _this.element.parentElement.scrollHeight;
                    _this.applyStyle();
                    (_a = _this.element.parentNode) === null || _a === void 0 ? void 0 : _a.addEventListener("mousewheel", _this.scroll.bind(_this));
                    // listener for touch events
                    (_b = _this.element.parentNode) === null || _b === void 0 ? void 0 : _b.addEventListener("touchstart", _this.touchStart.bind(_this));
                    (_c = _this.element.parentNode) === null || _c === void 0 ? void 0 : _c.addEventListener("touchmove", _this.touchMove.bind(_this));
                    (_d = _this.element.parentNode) === null || _d === void 0 ? void 0 : _d.addEventListener("touchend", _this.touchEnd.bind(_this));
                }, 0);
                return [2 /*return*/];
            });
        });
    };
    return ScrollBar;
}(OSElement));
export { ScrollBar as default };
//# sourceMappingURL=index.js.map