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
var content = function (_a) {
    var title = _a.title, text = _a.text;
    return "\n<div>\n  <h1>" + title + "</h1>\n  <div class=\"content\">\n    <p>" + text + "</p>\n    </div>\n</div>\n";
};
var AlertContent = /** @class */ (function (_super) {
    __extends(AlertContent, _super);
    function AlertContent(_a) {
        var title = _a.title, text = _a.text;
        var _this = _super.call(this, "alert", "alert-content") || this;
        var element = new DOMParser().parseFromString(content({ title: title, text: text }), "text/html").body.childNodes[0];
        var loader = element.querySelector(".content");
        _this.element.appendChild(element);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    padding: "1em 1em",
                    display: "block",
                    "& > div > h1": {
                        marginTop: 0
                    }
                },
                _a);
        };
        return _this;
    }
    return AlertContent;
}(OSElement));
export default AlertContent;
//# sourceMappingURL=index.js.map