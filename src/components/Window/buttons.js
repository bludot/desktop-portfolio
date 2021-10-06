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
var TopbarButton = /** @class */ (function (_super) {
    __extends(TopbarButton, _super);
    function TopbarButton(_a) {
        var action = _a.action, icon = _a.icon, color = _a.color;
        var _this = _super.call(this, "topbar-button", "topbar-button") || this;
        _this.action = action;
        _this.color = color;
        _this.icon = icon;
        _this.element.appendChild(_this.icon);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    height: "24px",
                    position: "relative",
                    width: "24px",
                    background: "transparent",
                    lineHeight: "24px",
                    textAlign: "center",
                    padding: "4px",
                    flex: "0 0 auto",
                    display: "flex",
                    justifyContent: "center",
                    flexFlow: "column nowrap",
                    alignItems: "center",
                    color: "#666",
                    fill: "#666",
                    "&:hover": {
                        color: "#000",
                        fill: "#000"
                    }
                    // zIndex: 9001,
                },
                _a);
        };
        return _this;
    }
    TopbarButton.prototype.load = function (element) {
        _super.prototype.load.call(this, element);
        this.element.addEventListener("click", this.action);
    };
    return TopbarButton;
}(OSElement));
var WindowButtons = /** @class */ (function (_super) {
    __extends(WindowButtons, _super);
    function WindowButtons(_a) {
        var close = _a.close, maximize = _a.maximize, minimize = _a.minimize;
        var _this = _super.call(this, "topbar-buttons", "topbar-buttons") || this;
        _this.buttons = [
            new TopbarButton({
                icon: (function () {
                    var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z\"></path></svg>", "text/html").body.childNodes[0];
                    icon.style.cssText = "\n            width: 20px;\n          ";
                    return icon;
                })(),
                action: close,
                color: "red"
            }),
            new TopbarButton({
                icon: (function () {
                    var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M19 13H5v-2h14v2z\"></path></svg>", "text/html").body.childNodes[0];
                    icon.style.cssText = "\n            width: 20px;\n          ";
                    return icon;
                })(),
                action: minimize,
                color: "#ccc"
            }),
            new TopbarButton({
                icon: (function () {
                    var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z\"></path></svg>", "text/html").body.childNodes[0];
                    icon.style.cssText = "\n            width: 20px;\n          ";
                    return icon;
                })(),
                action: maximize,
                color: "#ccc"
            })
        ];
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    height: "32px",
                    position: "relative",
                    background: "transparent",
                    lineHeight: "20px",
                    flex: "0 1 auto",
                    display: "flex",
                    flexFlow: "row nowrap"
                    // zIndex: 9001,
                },
                _a);
        };
        return _this;
    }
    WindowButtons.prototype.load = function (element) {
        var _this = this;
        _super.prototype.load.call(this, element);
        this.buttons.forEach(function (button) {
            button.load(_this.element);
        });
    };
    return WindowButtons;
}(OSElement));
export default WindowButtons;
//# sourceMappingURL=buttons.js.map