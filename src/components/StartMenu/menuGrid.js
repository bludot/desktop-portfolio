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
var MenuGrid = /** @class */ (function (_super) {
    __extends(MenuGrid, _super);
    function MenuGrid() {
        var _this = _super.call(this, "menugrid", "menu-grid") || this;
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    flex: "1 0 auto",
                    display: "flex",
                    flexFlow: "column nowrap",
                    zIndex: "1"
                    /*width: "160px",
                    height: "52px",
                    padding: "10px"
                    */
                },
                _a);
        };
        return _this;
    }
    return MenuGrid;
}(OSElement));
export default MenuGrid;
//# sourceMappingURL=menuGrid.js.map