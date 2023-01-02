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
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _super.prototype.load.call(this, element);
                this.element.addEventListener("click", function () {
                    _this.action(_this.element);
                });
                return [2 /*return*/];
            });
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
                    span.appendChild(document.createTextNode("James"));
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
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _super.prototype.load.call(this, element);
                this.buttons.forEach(function (button) {
                    button.load(_this.element);
                });
                return [2 /*return*/];
            });
        });
    };
    return TaskbarButtons;
}(OSElement));
export default TaskbarButtons;
//# sourceMappingURL=button.js.map