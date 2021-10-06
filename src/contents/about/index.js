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
import OSElement from "./../../utils/OSElement";
var content = "\n<div>\n  <h1>Bobet Marely</h1>\n</div>\n";
var AboutContent = /** @class */ (function (_super) {
    __extends(AboutContent, _super);
    function AboutContent() {
        var _this = _super.call(this, "aboutcontent", "about-content") || this;
        var element = new DOMParser().parseFromString(content, "text/html").body.childNodes[0];
        _this.element.appendChild(element);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {},
                _a);
        };
        return _this;
    }
    return AboutContent;
}(OSElement));
export default AboutContent;
//# sourceMappingURL=index.js.map