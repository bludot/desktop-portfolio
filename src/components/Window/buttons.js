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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                _super.prototype.load.call(this, element);
                this.element.addEventListener("click", this.action);
                return [2 /*return*/];
            });
        });
    };
    return TopbarButton;
}(OSElement));
var WindowButtons = /** @class */ (function (_super) {
    __extends(WindowButtons, _super);
    function WindowButtons(_a) {
        var isDialog = _a.isDialog, close = _a.close, maximize = _a.maximize, minimize = _a.minimize;
        var _this = _super.call(this, "topbar-buttons", "topbar-buttons") || this;
        if (isDialog) {
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
            ];
        }
        else {
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
        }
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
    return WindowButtons;
}(OSElement));
export default WindowButtons;
//# sourceMappingURL=buttons.js.map