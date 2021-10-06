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
var MenuItem = /** @class */ (function (_super) {
    __extends(MenuItem, _super);
    function MenuItem(_a) {
        var icon = _a.icon, text = _a.text, action = _a.action;
        var _this = _super.call(this, "menuitem", "menu-item") || this;
        _this.text = text;
        _this.action = action;
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    // width: "160px",
                    maxWidth: "150px",
                    height: "36px",
                    margin: "10px 0",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    flexFlow: "row nowrap",
                    borderRadius: "0px",
                    cursor: "pointer",
                    transition: "background 250ms ease",
                    "&:hover": {
                        background: "rgba(255,255,255,.5)"
                    }
                },
                _a);
        };
        _this.icon = icon;
        _this.element.appendChild(_this.icon);
        _this.element.appendChild(document.createTextNode(_this.text));
        return _this;
    }
    MenuItem.prototype.load = function (element) {
        _super.prototype.load.call(this, element);
        this.element.addEventListener("click", this.action);
    };
    return MenuItem;
}(OSElement));
export default MenuItem;
//# sourceMappingURL=menuItem.js.map