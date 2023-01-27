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
import WindowBlur from "../Window/blur";
import MenuItem from "./menuItem";
import User from "./user";
import MenuGrid from "./menuGrid";
import bridge from "./../../utils/bridge";
import windowManager from "../../utils/windowManager";
import AboutContent from "./../../contents/about";
import ExperienceContent from "../../contents/experience";
import AlertContent from "../../contents/alert";
import isMobile from 'is-mobile';
import FeatureFlagsApp from "../../apps/FeatureFlags";
var StartMenu = /** @class */ (function (_super) {
    __extends(StartMenu, _super);
    function StartMenu() {
        var _this = _super.call(this, "startmenu", "start-menu") || this;
        _this.isMobile = isMobile();
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    left: "15px",
                    bottom: "75px",
                    display: "flex",
                    position: "fixed",
                    flexFlow: "column nowrap",
                    // height: "300px",
                    padding: "10px",
                    borderRadius: "8px",
                    zIndex: "999",
                    background: "rgba(200,200,200, .5)",
                    boxShadow: "0 17px 50px 0 rgba(0, 0, 0, 0.19),\n        0 12px 15px 0 rgba(0, 0, 0, 0.24)"
                },
                _a);
        };
        // if (Settings.blur) {
        //
        // }
        var blur = new WindowBlur(60, 8);
        blur.load(_this.element);
        var menuGrid = new MenuGrid();
        menuGrid.load(_this.element);
        var user = new User();
        user.load(menuGrid.getElement());
        var about = new MenuItem({
            icon: (function () {
                var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"></path></svg>", "text/html").body.childNodes[0];
                icon.style.cssText = "\n        margin: 0 10px;\n          width: 20px;\n        ";
                return icon;
            })(),
            text: "About",
            action: function () {
                windowManager["new"]({
                    title: "About",
                    content: new AboutContent(),
                    desktop: bridge.get("Desktop")
                });
            }
        });
        about.load(menuGrid.getElement());
        var experience = new MenuItem({
            icon: (function () {
                var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z\"></path></svg>", "text/html").body.childNodes[0];
                icon.style.cssText = "\n        margin: 0 10px;\n          width: 20px;\n        ";
                return icon;
            })(),
            text: "Experience",
            action: function () {
                windowManager["new"]({
                    title: "Experience",
                    content: new ExperienceContent(),
                    desktop: bridge.get("Desktop"),
                    dimensions: {
                        width: 600,
                        height: 500
                    }
                });
            }
        });
        experience.load(menuGrid.getElement());
        var projects = new MenuItem({
            icon: (function () {
                var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3c-.46 0-.93.04-1.4.14-2.76.53-4.96 2.76-5.48 5.52-.48 2.61.48 5.01 2.22 6.56.43.38.66.91.66 1.47V19c0 1.1.9 2 2 2h.28c.35.6.98 1 1.72 1s1.38-.4 1.72-1H14c1.1 0 2-.9 2-2v-2.31c0-.55.22-1.09.64-1.46C18.09 13.95 19 12.08 19 10c0-3.87-3.13-7-7-7zm2 14h-4v-1h4v1zm-4 2v-1h4v1h-4zm5.31-5.26c-.09.08-.16.18-.24.26H8.92c-.08-.09-.15-.19-.24-.27-1.32-1.18-1.91-2.94-1.59-4.7.36-1.94 1.96-3.55 3.89-3.93.34-.07.68-.1 1.02-.1 2.76 0 5 2.24 5 5 0 1.43-.61 2.79-1.69 3.74z\"></path><path d=\"M11.5 11h1v3h-1z\"></path><path d=\"M9.6724 9.5808l.7071-.707 2.1213 2.1212-.7071.7071z\"></path><path d=\"M12.2081 11.7123l-.7071-.7071 2.1213-2.1213.7071.707z\"></path></svg>", "text/html").body.childNodes[0];
                icon.style.cssText = "\n        margin: 0 10px;\n          width: 20px;\n        ";
                return icon;
            })(),
            text: "Projects",
            action: function () {
                windowManager["new"]({
                    title: "Projects Unavailable",
                    content: new AlertContent({ title: "Projects Unavailable", text: "This window isnt built yet, come back later" }),
                    dimensions: {
                        width: 250,
                        height: 180
                    },
                    desktop: bridge.get("Desktop"),
                    isDialog: true
                });
            }
        });
        projects.load(menuGrid.getElement());
        var contact = new MenuItem({
            icon: (function () {
                var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z\"></path></svg>", "text/html").body.childNodes[0];
                icon.style.cssText = "\n        margin: 0 10px;\n        width: 20px;\n      ";
                return icon;
            })(),
            text: "Contact",
            action: function () {
                windowManager["new"]({
                    title: "Contact Unavailable",
                    content: new AlertContent({ title: "Contact Unavailable", text: "This window isnt built yet, come back later" }),
                    dimensions: {
                        width: 250,
                        height: 180
                    },
                    desktop: bridge.get("Desktop"),
                    isDialog: true
                });
            }
        });
        contact.load(menuGrid.getElement());
        var settings = new MenuItem({
            icon: (function () {
                var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z\"></path></svg>", "text/html").body.childNodes[0];
                icon.style.cssText = "\n        margin: 0 10px;\n        width: 20px;\n      ";
                return icon;
            })(),
            text: "Settings",
            action: function () {
                windowManager["new"]({
                    title: "Settings Unavailable",
                    content: new AlertContent({ title: "Settings Unavailable", text: "This window isnt built yet, come back later" }),
                    dimensions: {
                        width: 250,
                        height: 180
                    },
                    desktop: bridge.get("Desktop"),
                    isDialog: true
                });
            }
        });
        settings.load(menuGrid.getElement());
        if (_this.isMobile) {
            var featureflags = new MenuItem({
                icon: (function () {
                    var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiBox-root css-uqopch\" focusable=\"false\" aria-hidden=\"true\" viewBox=\"0 0 24 24\" data-testid=\"NewReleasesIcon\"><path d=\"m23 12-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-10 5h-2v-2h2v2zm0-4h-2V7h2v6z\"></path></svg>", "text/html").body.childNodes[0];
                    icon.style.cssText = "\n        margin: 0 10px;\n        width: 20px;\n      ";
                    return icon;
                })(),
                text: "feature flags",
                action: function () {
                    new FeatureFlagsApp().load();
                }
            });
            featureflags.load(menuGrid.getElement());
        }
        var logout = new MenuItem({
            icon: (function () {
                var icon = new DOMParser().parseFromString("<svg class=\"MuiSvgIcon-root jss179\" focusable=\"false\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z\"></path></svg>", "text/html").body.childNodes[0];
                icon.style.cssText = "\n        margin: 0 10px;\n        width: 20px;\n      ";
                return icon;
            })(),
            text: "logout",
            action: function () {
                windowManager["new"]({
                    title: "Command Unavailable",
                    content: new AlertContent({
                        title: "Command Unavailable",
                        text: "This window isnt built yet, come back later"
                    }),
                    dimensions: {
                        width: 250,
                        height: 180
                    },
                    desktop: bridge.get("Desktop"),
                    isDialog: true
                });
            }
        });
        logout.load(menuGrid.getElement());
        _this.menuItems = [];
        return _this;
    }
    StartMenu.prototype.load = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.parent) {
                    _super.prototype.load.call(this, element);
                    // window.addEventListener("click", this.unload.bind(this));
                }
                return [2 /*return*/];
            });
        });
    };
    return StartMenu;
}(OSElement));
export default StartMenu;
//# sourceMappingURL=index.js.map