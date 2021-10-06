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
import TitleBar from "./titlebar";
import WindowButtons from "./buttons";
var TopBar = /** @class */ (function (_super) {
    __extends(TopBar, _super);
    function TopBar(_a) {
        var title = _a.title, close = _a.close;
        var _this = _super.call(this, "topbar", "topbar") || this;
        _this.titlebar = new TitleBar({ title: title, className: "title-bar" });
        _this.element.className = "topbar-window";
        _this.windowButtons = new WindowButtons({
            close: close,
            maximize: null,
            minimize: function () { }
        });
        _this.windowButtons.load(_this.element);
        _this.titlebar.load(_this.element);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    borderTop: "#ccc",
                    height: "32px",
                    position: "relative",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "transparent",
                    // zIndex: 9001,
                    flex: "0 0 auto",
                    display: "flex",
                    flexFlow: "row nowrap"
                },
                _a);
        };
        return _this;
    }
    TopBar.prototype.mouseover = function () { };
    TopBar.prototype.mouseout = function () { };
    return TopBar;
}(OSElement));
// export default topbar_old;
export default TopBar;
//# sourceMappingURL=topbar.js.map