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
import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faTimes, faWindowMaximize, faWindowMinimize, } from "@fortawesome/free-solid-svg-icons";
import Desktop from "./components/Desktop";
import jss from "jss";
import preset from "jss-preset-default";
import nested from "jss-plugin-nested";
import settings from "./utils/settings";
import bridge from "./utils/bridge";
import Bootscreen from "./components/Bootscreen";
import queryString from "query-string";
import Logger, { GlobalLogger } from "./Logger";
import windowManager from "./utils/windowManager";
import LoggerWindow from "./contents/logger";
import ExperienceContent from "./contents/experience";
import AboutContent from "./contents/about";
import AlertContent from "./contents/alert";
// @ts-ignore
window.LOGGER = GlobalLogger.getInstance();
jss.setup(preset());
jss.use(nested());
var count = 2;
var bootscreen = new Bootscreen();
bootscreen.load(document.querySelector("#app"));
var logger = new Logger("Bootsequence");
logger.info("Starting up...");
function startup() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.debug("setting Dekstop Image: " + settings.desktopImage.original);
                    return [4 /*yield*/, settings.setDesktopImage("/assets/main_desktop_background.jpg")];
                case 1:
                    _a.sent();
                    logger.debug("Dekstop Image Set:  " + settings.desktopImage.original);
                    return [2 /*return*/];
            }
        });
    });
}
var mainWindows = {
    "experience": function (_a) {
        var top = _a.top, left = _a.left;
        windowManager["new"]({
            title: "Experience",
            content: new ExperienceContent(),
            desktop: bridge.get("Desktop"),
            dimensions: {
                width: 600,
                height: 500
            },
            windowPosition: top || left ? {
                top: top,
                left: left
            } : {},
            center: top || left ? false : true
        });
    },
    "about": function (_a) {
        var top = _a.top, left = _a.left;
        windowManager["new"]({
            title: "About",
            content: new AboutContent(),
            desktop: bridge.get("Desktop"),
            windowPosition: top || left ? {
                top: top,
                left: left
            } : {},
            center: top || left ? false : true
        });
    },
    "alert": function () {
        windowManager["new"]({
            title: "Unexpected Error",
            content: new AlertContent({ title: "Unexpected Error", text: "Unable to do this action" }),
            dimensions: {
                width: 250,
                height: 150
            },
            desktop: bridge.get("Desktop"),
            isDialog: true
        });
    }
};
startup().then(function () { return __awaiter(void 0, void 0, void 0, function () {
    var desktop, params, windows_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                desktop = new Desktop({
                    backgroundColor: "#EEEEEE",
                    mainElement: document.querySelector("#app")
                });
                bridge.set("Desktop", desktop);
                params = queryString.parse(location.search);
                if (!(params.bootscreen === "1")) return [3 /*break*/, 1];
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, desktop.startup(bootscreen)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                if (params.debug === "1") {
                    windowManager["new"]({
                        title: "Debugger",
                        content: new LoggerWindow(),
                        dimensions: { width: 800, height: 400 },
                        desktop: bridge.get("Desktop")
                    });
                }
                if (params.windows) {
                    windows_1 = params.windows.split(',');
                    windows_1.forEach(function (windowToOpen) {
                        if (windows_1.includes("experience") && windows_1.includes("about")) {
                            if (windowToOpen == "about") {
                                mainWindows[windowToOpen]({ top: 30, left: 30 });
                                return;
                            }
                            if (windowToOpen == "experience") {
                                mainWindows[windowToOpen]({ top: 30, left: 600 });
                                return;
                            }
                            if (mainWindows[windowToOpen]) {
                                mainWindows[windowToOpen]({});
                            }
                            return;
                        }
                        if (mainWindows[windowToOpen]) {
                            mainWindows[windowToOpen]({});
                        }
                    });
                }
                mainWindows["about"]({ top: 30, left: 30 });
                mainWindows["experience"]({ top: 30, left: 600 });
                // We are only using the user-astronaut icon
                library.add(faTimes, faWindowMaximize, faWindowMinimize);
                // Replace any existing <i> tags with <svg> and set up a MutationObserver to
                // continue doing this as the DOM changes.
                dom.watch();
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=index.js.map