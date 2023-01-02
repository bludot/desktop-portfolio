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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import OSElement from "./OSElement";
var ResizableBorder = /** @class */ (function (_super) {
    __extends(ResizableBorder, _super);
    function ResizableBorder(type, width) {
        var _this = _super.call(this, "border", "border") || this;
        _this.element.className = "border";
        _this.type = type;
        _this.borderWidth = width || 3;
        _this.parentDimensions = {
            width: 0,
            height: 0,
            x: 0,
            y: 0
        };
        _this.cursorPosition = {
            x: 0,
            y: 0
        };
        var style = {
            position: "absolute",
            zIndex: "1",
            overflow: "hidden"
        };
        if (type == ResizeType.TOP) {
            _this.style = function () {
                var _a;
                return (_a = {},
                    _a[_this.id] = __assign(__assign({}, style), { top: -_this.borderWidth, left: 0, right: 0, height: _this.borderWidth, cursor: "ns-resize" }),
                    _a);
            };
        }
        else if (type == ResizeType.RIGHT) {
            _this.style = function () {
                var _a;
                return (_a = {},
                    _a[_this.id] = __assign(__assign({}, style), { top: 0, bottom: 0, right: -_this.borderWidth, width: _this.borderWidth, cursor: "ew-resize" }),
                    _a);
            };
        }
        else if (type == ResizeType.BOTTOM) {
            _this.style = function () {
                var _a;
                return (_a = {},
                    _a[_this.id] = __assign(__assign({}, style), { bottom: -_this.borderWidth, right: 0, left: 0, height: _this.borderWidth, cursor: "ns-resize" }),
                    _a);
            };
        }
        else if (type == ResizeType.LEFT) {
            _this.style = function () {
                var _a;
                return (_a = {},
                    _a[_this.id] = __assign(__assign({}, style), { bottom: 0, top: 0, left: -_this.borderWidth, width: _this.borderWidth, cursor: "ew-resize" }),
                    _a);
            };
        }
        else if (type == ResizeType.BOTTOM_RIGHT) {
            _this.style = function () {
                var _a;
                return (_a = {},
                    _a[_this.id] = __assign(__assign({}, style), { bottom: -_this.borderWidth, right: -_this.borderWidth, width: _this.borderWidth, height: _this.borderWidth, cursor: "nwse-resize" }),
                    _a);
            };
        }
        else if (type == ResizeType.BOTTOM_LEFT) {
            _this.style = function () {
                var _a;
                return (_a = {},
                    _a[_this.id] = __assign(__assign({}, style), { bottom: -_this.borderWidth, left: -_this.borderWidth, width: _this.borderWidth, height: _this.borderWidth, cursor: "nesw-resize" }),
                    _a);
            };
        }
        else if (type == ResizeType.TOP_LEFT) {
            _this.style = function () {
                var _a;
                return (_a = {},
                    _a[_this.id] = __assign(__assign({}, style), { top: -_this.borderWidth, left: -_this.borderWidth, width: _this.borderWidth, height: _this.borderWidth, cursor: "nwse-resize" }),
                    _a);
            };
        }
        else if (type == ResizeType.TOP_RIGHT) {
            _this.style = function () {
                var _a;
                return (_a = {},
                    _a[_this.id] = __assign(__assign({}, style), { top: -_this.borderWidth, right: -_this.borderWidth, width: _this.borderWidth, height: _this.borderWidth, cursor: "nesw-resize" }),
                    _a);
            };
        }
        return _this;
    }
    ResizableBorder.prototype.load = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _super.prototype.load.call(this, element);
                setTimeout(function () {
                    _this.element.addEventListener("mousedown", _this.mouseDown.bind(_this));
                }, 0);
                return [2 /*return*/];
            });
        });
    };
    ResizableBorder.prototype.mouseDown = function (e) {
        console.log("parent", this.parent);
        this.parentDimensions.width = this.parent.clientWidth;
        this.parentDimensions.height = this.parent.clientHeight;
        this.parentDimensions.x = this.parent.offsetLeft;
        this.parentDimensions.y = this.parent.offsetTop;
        this.cursorPosition.y = e.clientY;
        this.cursorPosition.x = e.clientX;
        var mousemove = this.mouseMove.bind(this);
        window.addEventListener("mousemove", mousemove);
        window.addEventListener("mouseup", function (e) {
            window.removeEventListener("mousemove", mousemove);
        });
    };
    ResizableBorder.prototype.updateParentDimensions = function (element, x, y, width, height) {
        element.style.top = y + "px";
        element.style.left = x + "px";
        element.style.width = width + "px";
        element.style.height = height + "px";
    };
    ResizableBorder.prototype.mouseMove = function (e) {
        e.preventDefault();
        if (this.type === ResizeType.RIGHT) {
            this.updateParentDimensions(this.parent, this.parentDimensions.x, this.parentDimensions.y, this.parentDimensions.width + (e.clientX - this.cursorPosition.x), this.parentDimensions.height);
        }
        else if (this.type === ResizeType.LEFT) {
            this.updateParentDimensions(this.parent, this.parentDimensions.x + (e.clientX - this.cursorPosition.x), this.parentDimensions.y, this.parentDimensions.width - (e.clientX - this.cursorPosition.x), this.parentDimensions.height);
        }
        else if (this.type === ResizeType.TOP) {
            this.updateParentDimensions(this.parent, this.parentDimensions.x, this.parentDimensions.y + (e.clientY - this.cursorPosition.y), this.parentDimensions.width, this.parentDimensions.height - (e.clientY - this.cursorPosition.y));
        }
        else if (this.type === ResizeType.BOTTOM) {
            this.updateParentDimensions(this.parent, this.parentDimensions.x, this.parentDimensions.y, this.parentDimensions.width, this.parentDimensions.height + (e.clientY - this.cursorPosition.y));
        }
        else if (this.type === ResizeType.BOTTOM_RIGHT) {
            this.updateParentDimensions(this.parent, this.parentDimensions.x, this.parentDimensions.y, this.parentDimensions.width + (e.clientX - this.cursorPosition.x), this.parentDimensions.height + (e.clientY - this.cursorPosition.y));
        }
        else if (this.type === ResizeType.TOP_LEFT) {
            this.updateParentDimensions(this.parent, this.parentDimensions.x + (e.clientX - this.cursorPosition.x), this.parentDimensions.y + (e.clientY - this.cursorPosition.y), this.parentDimensions.width - (e.clientX - this.cursorPosition.x), this.parentDimensions.height - (e.clientY - this.cursorPosition.y));
        }
        else if (this.type === ResizeType.TOP_RIGHT) {
            this.updateParentDimensions(this.parent, this.parentDimensions.x, this.parentDimensions.y + (e.clientY - this.cursorPosition.y), this.parentDimensions.width + (e.clientX - this.cursorPosition.x), this.parentDimensions.height - (e.clientY - this.cursorPosition.y));
        }
        else if (this.type === ResizeType.BOTTOM_LEFT) {
            this.updateParentDimensions(this.parent, this.parentDimensions.x + (e.clientX - this.cursorPosition.x), this.parentDimensions.y, this.parentDimensions.width - (e.clientX - this.cursorPosition.x), this.parentDimensions.height + (e.clientY - this.cursorPosition.y));
        }
    };
    return ResizableBorder;
}(OSElement));
var ResizeType;
(function (ResizeType) {
    ResizeType["TOP_RIGHT"] = "topright";
    ResizeType["TOP_LEFT"] = "topleft";
    ResizeType["BOTTOM_RIGHT"] = "bottomright";
    ResizeType["BOTTOM_LEFT"] = "bottomleft";
    ResizeType["TOP"] = "top";
    ResizeType["LEFT"] = "left";
    ResizeType["RIGHT"] = "right";
    ResizeType["BOTTOM"] = "bottom";
})(ResizeType || (ResizeType = {}));
function Resizeable(element) {
    //setTimeout(function () {
    var topBorder = new ResizableBorder(ResizeType.TOP);
    topBorder.load(element.element);
    var rightBorder = new ResizableBorder(ResizeType.RIGHT);
    rightBorder.load(element.element);
    var bottomBorder = new ResizableBorder(ResizeType.BOTTOM);
    bottomBorder.load(element.element);
    var leftBorder = new ResizableBorder(ResizeType.LEFT);
    leftBorder.load(element.element);
    var bottomRightBorder = new ResizableBorder(ResizeType.BOTTOM_RIGHT);
    bottomRightBorder.load(element.element);
    var bottomLeftBorder = new ResizableBorder(ResizeType.BOTTOM_LEFT);
    bottomLeftBorder.load(element.element);
    var topLeftBorder = new ResizableBorder(ResizeType.TOP_LEFT);
    topLeftBorder.load(element.element);
    var topRightBorder = new ResizableBorder(ResizeType.TOP_RIGHT);
    topRightBorder.load(element.element);
}
export default Resizeable;
//# sourceMappingURL=resizable.js.map