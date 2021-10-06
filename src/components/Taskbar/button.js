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
import StartMenu from "./../StartMenu";
var TaskbarButton = /** @class */ (function (_super) {
    __extends(TaskbarButton, _super);
    function TaskbarButton(_a) {
        var action = _a.action, icon = _a.icon;
        var _this = _super.call(this, "taskbar-button", "taskbar-button") || this;
        _this.action = action;
        _this.icon = icon;
        _this.element.appendChild(_this.icon);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    height: "50px",
                    position: "relative",
                    lineHeight: "35px",
                    textAlign: "center",
                    flex: "0 0 auto",
                    display: "flex",
                    justifyContent: "center",
                    flexFlow: "column nowrap",
                    alignItems: "center",
                    cursor: "pointer",
                    "&:before": {
                        content: "''",
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        right: 0,
                        left: 0,
                        borderRadius: "8px",
                        margin: "5px",
                        transition: "background-color 150ms ease"
                    },
                    "&:hover": {
                        "&:before": {
                            backgroundColor: "rgba(255,255,255,.5)"
                        }
                    }
                    // zIndex: 9001,
                },
                _a);
        };
        return _this;
    }
    TaskbarButton.prototype.load = function (element) {
        var _this = this;
        _super.prototype.load.call(this, element);
        this.element.addEventListener("click", function () {
            _this.action(_this.element);
        });
    };
    return TaskbarButton;
}(OSElement));
var TaskbarButtons = /** @class */ (function (_super) {
    __extends(TaskbarButtons, _super);
    function TaskbarButtons() {
        var _this = _super.call(this, "taskbar-buttons", "taskbar-buttons") || this;
        var startMenu = new StartMenu();
        _this.buttons = [
            new TaskbarButton({
                icon: (function () {
                    var container = document.createElement("div");
                    container.style.cssText = "\n            display: flex;\n            flex-flow: row nowrap;\n            flex: 1 1 auto;\n            align-items: center;\n            margin: 5px;\n            z-index: 1;\n          ";
                    var icon = document.createElement("div");
                    icon.style.cssText = "\n            flex: 1 1 auto;\n            width: 25px;\n            height: 25px;\n            background-image: url(http://placekitten.com/40/40);\n            background-size: cover;\n            background-position: center;\n            border-radius: 100%;\n            border: 1px solid #666;\n            display: inline-block;\n            margin: 0 4px;\n          ";
                    container.appendChild(icon);
                    var span = document.createElement("span");
                    span.appendChild(document.createTextNode("Bobet"));
                    span.style.cssText = "\n            flex: 1 1 auto;\n            display: inline-block;\n            margin: 0 4px;\n          ";
                    container.appendChild(span);
                    return container;
                })(),
                action: function (element) {
                    startMenu.load(document.querySelector("#app"));
                    var unload = startMenu.unload.bind(startMenu);
                    window.addEventListener("click", unload, true);
                    window.addEventListener("click", function () {
                        window.removeEventListener("click", unload, true);
                    }, true);
                }
            })
        ];
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    height: "35px",
                    position: "relative",
                    lineHeight: "35px",
                    flex: "0 1 auto",
                    display: "flex",
                    flexFlow: "row nowrap"
                    // zIndex: 9001,
                },
                _a);
        };
        return _this;
    }
    TaskbarButtons.prototype.load = function (element) {
        var _this = this;
        _super.prototype.load.call(this, element);
        this.buttons.forEach(function (button) {
            button.load(_this.element);
        });
    };
    return TaskbarButtons;
}(OSElement));
export default TaskbarButtons;
//# sourceMappingURL=button.js.map