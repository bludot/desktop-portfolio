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
import App from "../App";
import windowManager from "../../utils/windowManager";
import bridge from "../../utils/bridge";
import OSElement from "../../utils/OSElement";
import SwitchToggle from "../../components/SwitchToggle";
import db, { FeatureFlag } from './../../Store';
var flags = {
    "custom_scrollbar": {
        name: "custom scrollbar",
        enabled: false
    }
};
var FeatureFlagsApp = /** @class */ (function (_super) {
    __extends(FeatureFlagsApp, _super);
    function FeatureFlagsApp() {
        return _super.call(this, "FeatureFlagsApp") || this;
    }
    FeatureFlagsApp.prototype.loadFeatures = function () {
        return __awaiter(this, void 0, void 0, function () {
            var featureFlags, _loop_1, feature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.featureFlags.toArray()];
                    case 1:
                        featureFlags = _a.sent();
                        _loop_1 = function (feature) {
                            var isSaved = featureFlags.find(function (item) {
                                return item.code == feature;
                            });
                            if (!isSaved) {
                                var newFeature = new FeatureFlag(feature, flags[feature].name, flags[feature].enabled);
                                newFeature.save();
                            }
                        };
                        for (feature in flags) {
                            _loop_1(feature);
                        }
                        return [2 /*return*/, db.featureFlags.toArray()];
                }
            });
        });
    };
    FeatureFlagsApp.prototype.load = function () {
        var _this = this;
        this.loadFeatures().then(function (flags) {
            _this.featureFlags = flags;
            windowManager["new"]({
                title: _this.name,
                content: new FeatureFlagsContent(_this.featureFlags),
                desktop: bridge.get("Desktop")
            });
        });
    };
    return FeatureFlagsApp;
}(App));
var FeatureFlagsContent = /** @class */ (function (_super) {
    __extends(FeatureFlagsContent, _super);
    function FeatureFlagsContent(featureFlags) {
        var _this = _super.call(this, "FeatureFlagsContent", "feature-flags-content") || this;
        var element = document.createElement('div');
        for (var feature in featureFlags) {
            var switchToggle = new SwitchToggle(10, null, null, featureFlags[feature].enabled);
            var container = document.createElement('div');
            var span = document.createElement('span');
            span.appendChild(document.createTextNode(featureFlags[feature].name));
            container.appendChild(span);
            switchToggle.load(container);
            var onclick_1 = function (flag) {
                return function () {
                    flag.enabled = this.element.querySelector('input[type=checkbox]').checked;
                    flag.save();
                };
            };
            switchToggle.setOnClick(onclick_1(featureFlags[feature]));
            element.appendChild(container);
        }
        _this.element.appendChild(element);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    "& > div > div": {
                        height: "20px",
                        borderBottom: "1px solid #ccc",
                        display: "flex",
                        flexFlow: "row nowrap",
                        justifyContent: "space-between",
                        margin: "10px",
                        alignItems: "center",
                        "& > *": {
                            flex: "0 1 auto"
                        }
                    }
                },
                _a);
        };
        return _this;
    }
    FeatureFlagsContent.prototype.load = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                _super.prototype.load.call(this, element);
                return [2 /*return*/];
            });
        });
    };
    return FeatureFlagsContent;
}(OSElement));
export default FeatureFlagsApp;
//# sourceMappingURL=index.js.map