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
import settings from "../../utils/settings";
var Bootscreen = /** @class */ (function (_super) {
    __extends(Bootscreen, _super);
    function Bootscreen() {
        var _this = _super.call(this, "Bootscreen", "bootscreen") || this;
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    position: "fixed",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundImage: "url(" + settings.getDesktopImage().original + ")",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    zIndex: "9999",
                    overflow: "hidden"
                },
                _a);
        };
        return _this;
    }
    return Bootscreen;
}(OSElement));
export default Bootscreen;
//# sourceMappingURL=index.js.map