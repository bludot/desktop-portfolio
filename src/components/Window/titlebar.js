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
var Title = /** @class */ (function (_super) {
    __extends(Title, _super);
    function Title(_a) {
        var title = _a.title;
        var _this = _super.call(this, "title", "title") || this;
        _this.title = title;
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    height: "32px",
                    position: "relative",
                    background: "transparent",
                    lineHeight: "32px",
                    flex: "1 1 auto",
                    display: "flex",
                    flexFlow: "row nowrap",
                    textAlign: "center",
                    justifyContent: "center"
                    // zIndex: 9001,
                },
                _a);
        };
        return _this;
    }
    Title.prototype.load = function (element) {
        this.element.appendChild(document.createTextNode(this.title));
        _super.prototype.load.call(this, element);
    };
    return Title;
}(OSElement));
var TitleBar = /** @class */ (function (_super) {
    __extends(TitleBar, _super);
    function TitleBar(_a) {
        var title = _a.title, className = _a.className;
        var _this = _super.call(this, "titlebar", "title-bar") || this;
        _this.className = className;
        _this.title = new Title({ title: title });
        _this.title.load(_this.element);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    flex: "1 1 auto"
                },
                _a);
        };
        return _this;
    }
    TitleBar.prototype.applyTitle = function (title) {
        this.title = title;
        // this.element.append(this.title);
        this.title.load(this.element);
    };
    TitleBar.prototype.load = function (element) {
        _super.prototype.load.call(this, element);
    };
    return TitleBar;
}(OSElement));
export default TitleBar;
//# sourceMappingURL=titlebar.js.map