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
import OSElement from "../../utils/OSElement";
import { getWindowWidth, getWindowHeight } from "./../../utils/utils";
import TopBar from "./topbar";
import WindowBlur from "./blur";
var OSWindow = /** @class */ (function (_super) {
    __extends(OSWindow, _super);
    function OSWindow(_a) {
        var title = _a.title, content = _a.content, desktop = _a.desktop, onActive = _a.onActive, onClose = _a.onClose, _b = _a.center, center = _b === void 0 ? true : _b, _c = _a.dimensions, dimensions = _c === void 0 ? {
            width: 400,
            height: 400
        } : _c;
        var _this = _super.call(this, "window", "window") || this;
        _this.className = "window";
        _this.center = false;
        _this.active = true;
        _this.dimensions = {
            width: 400,
            height: 400
        };
        // const blur = document.createElement("blur");
        var blur = new WindowBlur(60, 8);
        // this.element.appendChild(blur);
        blur.load(_this.element);
        _this.title = title;
        _this.content = content;
        _this.desktop = desktop;
        _this.windowPosition = {};
        _this.onActive = onActive;
        _this.onClose = onClose;
        _this.center = center;
        _this.dimensions = dimensions;
        _this.topbar = new TopBar({ title: title, close: function () { return _this.onClose(_this); } });
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    background: "rgba(200,200,200, .5)",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    height: _this.dimensions.height + "px",
                    width: _this.dimensions.width + "px",
                    borderRadius: "8px",
                    overflow: "hidden",
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
        // console.log("THIS", this);
        this.element.style.zIndex = index.toString();
    };
    OSWindow.prototype.mouseup = function (e) {
        window.removeEventListener("mousemove", this.mousemove.bind(this));
        window.removeEventListener("mouseup", this.mouseup.bind(this));
        //window.removeEventListener("mousemove", this.mouseMoveLeft);
        //window.removeEventListener("mousemove", this.mouseMoveTop);
        this.windowPosition = {};
    };
    OSWindow.prototype.mousemove = function (e) {
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
        var _this = this;
        var main = document.createElement("div");
        main.style.cssText = "\n    width: 100%;\n  height: 100%;\n  z-index: 1;";
        if (typeof this.content.load === "function") {
            // main.appendChild(this.content());
            this.content.load(main);
        }
        else {
            main.appendChild(this.content);
        }
        var onClose = function () {
            _this.onClose(_this);
        };
        this.topbar.load(this.element);
        // this.element.appendChild(topbar({ title: this.title, close: onClose }));
        this.element.appendChild(main);
        // WindowManager.init(this.element);
        _super.prototype.load.call(this, this.desktop.getElement());
        if (this.center) {
            console.log("WIDTH", getWindowWidth());
            this.element.style.left = getWindowWidth() / 2 - this.dimensions.width / 2 + "px";
            this.element.style.top = getWindowHeight() / 2 -
                this.dimensions.height / 2 -
                this.desktop.getTaskbar().getElement().clientHeight + "px";
        }
        this.makeMovable();
    };
    return OSWindow;
}(OSElement));
export default OSWindow;
//# sourceMappingURL=index.js.map