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
var ProfileImg = /** @class */ (function (_super) {
    __extends(ProfileImg, _super);
    function ProfileImg() {
        var _this = _super.call(this, "menuprofileimg", "menu-profile-img") || this;
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    width: "100px",
                    height: "100px",
                    background: "url(https://placekitten.com/100/100)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "100%",
                    position: "relative",
                    left: 0,
                    right: 0,
                    margin: "0 auto",
                    marginTop: "-50px"
                },
                _a);
        };
        return _this;
    }
    return ProfileImg;
}(OSElement));
export default ProfileImg;
//# sourceMappingURL=profileImg.js.map