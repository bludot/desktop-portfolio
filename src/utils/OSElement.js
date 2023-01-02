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
import jss from "jss";
import Logger from "../Logger";
var OSElement = /** @class */ (function () {
    function OSElement(tagName, id, instanceName) {
        this.element = document.createElement(tagName);
        this.element.id = this.id = id;
        this.instanceName = instanceName || tagName;
        this.logger = new Logger(this.instanceName);
        this.logger.debug("Initializing");
    }
    OSElement.prototype.applyStyle = function () {
        this.logger.debug("Applying styles");
        if (this.styleSheet) {
            this.styleSheet.detach();
        }
        this.styleSheet = jss.createStyleSheet(this.style());
        var classes = this.styleSheet.attach().classes;
        this.element.className += " " + classes[this.id];
    };
    OSElement.prototype.unloadStyle = function () {
        this.logger.debug("Unloading styles");
        if (this.styleSheet) {
            this.styleSheet.detach();
            this.styleSheet = null;
        }
        this.logger.debug("Unloaded styles");
    };
    OSElement.prototype.beforeLoad = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug("beforeLoad hook");
                return [2 /*return*/];
            });
        });
    };
    OSElement.prototype.afterLoad = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug("afterLoad hook");
                return [2 /*return*/];
            });
        });
    };
    OSElement.prototype.load = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug("Loading Instance");
                        return [4 /*yield*/, this.beforeLoad()];
                    case 1:
                        _a.sent();
                        this.logger.debug("Finished beforeLoad hook");
                        if (this.parent) {
                            console.log(this.parent);
                            throw new Error("Already loaded! did you mean to reload?");
                        }
                        this.parent = element;
                        if (this.className) {
                            this.element.className = this.className;
                        }
                        this.applyStyle();
                        this.logger.debug("Applyied styles");
                        this.parent.appendChild(this.element);
                        return [4 /*yield*/, this.afterLoad()];
                    case 2:
                        _a.sent();
                        this.logger.debug("Finished afterLoad hook");
                        this.logger.debug("Loaded Instance");
                        return [2 /*return*/];
                }
            });
        });
    };
    OSElement.prototype.beforeUnload = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug("beforeUnload hook");
                return [2 /*return*/];
            });
        });
    };
    OSElement.prototype.afterUnload = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug("afterUnload hook");
                return [2 /*return*/];
            });
        });
    };
    OSElement.prototype.unload = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.beforeUnload()];
                    case 1:
                        _a.sent();
                        this.logger.debug("Finished beforeUnload hook");
                        this.parent.removeChild(this.element);
                        this.parent = null;
                        this.unloadStyle();
                        this.logger.debug("Finished unloadStyle hook");
                        return [4 /*yield*/, this.afterUnload()];
                    case 2:
                        _a.sent();
                        this.logger.debug("Finished afterUnload hook");
                        this.logger.debug("Unloaded Instance");
                        return [2 /*return*/];
                }
            });
        });
    };
    OSElement.prototype.reload = function () {
        this.logger.debug("Reloading Instance");
        var tmpParent = this.parent;
        this.unload();
        this.load(tmpParent);
        this.applyStyle();
        this.logger.debug("Reloaded Instance");
    };
    OSElement.prototype.getElement = function () {
        return this.element;
    };
    OSElement.prototype.updateDimension = function (x, y, width, height) {
        this.element.style.top = y + "px";
        this.element.style.left = x + "px";
        this.element.style.width = width + "px";
        this.element.style.height = height + "px";
    };
    return OSElement;
}());
export default OSElement;
//# sourceMappingURL=OSElement.js.map