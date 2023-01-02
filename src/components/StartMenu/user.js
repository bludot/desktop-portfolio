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
var User = /** @class */ (function (_super) {
    __extends(User, _super);
    function User() {
        var _this = _super.call(this, "userinfo", "user-info") || this;
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    borderRadius: "100%",
                    position: "relative",
                    flex: "1 1 auto",
                    margin: "10px 10px"
                },
                _a);
        };
        var header = document.createElement("h1");
        header.style.cssText = "\n      font-size: 34px;\n      font-weight: 200;\n      white-space: nowrap;\n      margin: 5px 0;\n      flex: 1 1 auto;\n    ";
        header.appendChild(document.createTextNode("James Trotter"));
        var subtitle = document.createElement("sub");
        subtitle.style.cssText = "\n      font-size: 16px;\n      font-weight: 400;\n      white-space: nowrap;\n      margin: 5px 0;\n      flex: 1 1 auto;\n    ";
        subtitle.appendChild(document.createTextNode("Software Engineer"));
        _this.element.appendChild(header);
        _this.element.appendChild(subtitle);
        return _this;
    }
    return User;
}(OSElement));
export default User;
//# sourceMappingURL=user.js.map