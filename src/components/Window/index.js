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
import OSElement from "../../utils/OSElement";
import { getWindowWidth, getWindowHeight } from "./../../utils/utils";
import TopBar from "./topbar";
import WindowBlur from "./blur";
import Resizable from "../../utils/resizable";
var OSWindow = /** @class */ (function (_super) {
    __extends(OSWindow, _super);
    function OSWindow(_a) {
        var isDialog = _a.isDialog, title = _a.title, content = _a.content, desktop = _a.desktop, onActive = _a.onActive, onClose = _a.onClose, _b = _a.center, center = _b === void 0 ? true : _b, _c = _a.dimensions, dimensions = _c === void 0 ? {
            width: 400,
            height: 400
        } : _c, windowPosition = _a.windowPosition;
        var _this = _super.call(this, "window", "window") || this;
        _this.isDialog = false;
        _this.className = "window";
        _this.center = false;
        _this.active = true;
        _this.dimensions = {
            width: 400,
            height: 400
        };
        var blur = new WindowBlur(60, 8);
        blur.load(_this.element);
        _this.title = title;
        _this.content = content;
        _this.desktop = desktop;
        _this.onActive = onActive;
        _this.onClose = onClose;
        _this.center = center;
        _this.dimensions = dimensions;
        _this.topbar = new TopBar({ title: title, close: function () { return _this.onClose(_this); }, isDialog: isDialog });
        _this.windowPosition = windowPosition || {};
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    background: "rgba(200,200,200, .5)",
                    position: "fixed",
                    top: _this.windowPosition.top || 0,
                    left: _this.windowPosition.left || 0,
                    height: _this.dimensions.height + "px",
                    width: _this.dimensions.width + "px",
                    borderRadius: "8px",
                    // overflow: "hidden",
                    // overflow: "auto",
                    boxShadow: _this.active
                        ? "0 17px 50px 0 rgba(0, 0, 0, 0.19),\n        0 12px 15px 0 rgba(0, 0, 0, 0.24)"
                        : "0px 2px 5px 0px rgba(0, 0, 0, 0.16),\n                0 2px 5px 0 rgba(0, 0, 0, 0.26)",
                    display: "flex",
                    flexFlow: "column nowrap"
                },
                _a);
        };
        return _this;
    }
    OSWindow.prototype.unfocus = function () {
        this.active = false;
        this.applyStyle();
    };
    OSWindow.prototype.focus = function () {
        this.active = true;
        this.applyStyle();
    };
    OSWindow.prototype.setIndex = function (index) {
        this.element.style.zIndex = index.toString();
    };
    OSWindow.prototype.mouseup = function (e) {
        window.removeEventListener("mousemove", this.mousemove.bind(this));
        window.removeEventListener("mouseup", this.mouseup.bind(this));
        this.windowPosition = {};
    };
    OSWindow.prototype.mousemove = function (e) {
        e.preventDefault();
        this.element.style.top = e.pageY - this.windowPosition.top + "px";
        this.element.style.left = e.pageX - this.windowPosition.left + "px";
    };
    OSWindow.prototype.mousedown = function (e) {
        if (this.windowPosition && // 👈 null and undefined check
            Object.keys(this.windowPosition).length === 0 &&
            this.windowPosition.constructor === Object) {
            this.windowPosition = {
                y: e.pageY,
                x: e.pageX,
                top: e.pageY - parseInt(this.element.style.top) || e.pageY,
                left: e.pageX - parseInt(this.element.style.left) || e.pageX
            };
        }
        this.onActive(this);
        window.addEventListener("mouseup", this.mouseup.bind(this));
        window.addEventListener("mousemove", this.mousemove.bind(this));
    };
    OSWindow.prototype.mousedownWindow = function () {
        this.onActive(this);
    };
    OSWindow.prototype.makeMovable = function () {
        console.log("making movable");
        this.element
            .querySelector(".topbar-window")
            .addEventListener("mousedown", this.mousedown.bind(this));
        this.element.addEventListener("mousedown", this.mousedownWindow.bind(this));
    };
    OSWindow.prototype.load = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var main, onClose;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        main = document.createElement("div");
                        main.style.cssText = "\n    width: 100%;\n    height: auto;\n    z-index: 1;\n    flex: 1 1 auto;\n    overflow: auto;\n    ";
                        if (!(typeof this.content.load === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.content.load(main)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        main.appendChild(this.content);
                        _a.label = 3;
                    case 3:
                        onClose = function () {
                            _this.onClose(_this);
                        };
                        return [4 /*yield*/, this.topbar.load(this.element)];
                    case 4:
                        _a.sent();
                        this.element.appendChild(main);
                        _super.prototype.load.call(this, this.desktop.getElement());
                        if (this.center) {
                            console.log("WIDTH", getWindowWidth());
                            this.element.style.left = getWindowWidth() / 2 - this.dimensions.width / 2 + "px";
                            this.element.style.top = getWindowHeight() / 2 -
                                this.dimensions.height / 2 -
                                this.desktop.getTaskbar().getElement().clientHeight + "px";
                        }
                        this.makeMovable();
                        this.makeResizable();
                        return [2 /*return*/];
                }
            });
        });
    };
    OSWindow.prototype.makeResizable = function () {
        Resizable(this);
    };
    return OSWindow;
}(OSElement));
export default OSWindow;
//# sourceMappingURL=index.js.map