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
var content = "\n<div>\n  <h1>About</h1>\n  <h2>James Trotter</h2>\n  <p>Hello!</p>\n  <p>I am a software engineer passionate about technology. You can see my experience by going to the start menu and\n  selecting experience</p>\n  <h2>About This Project</h2>\n  <p>\n  This project was created to play around without using any frameworks (old style!) but apply modern patterns we \n  currently use today. You can checkout this project \n  <a target=\"_blank\" href=\"https://github.com/bludot/desktop-portfolio\">Here</a>.\n  Since I first started with programming I have had this fascination with the UI of desktop systems. Knowing only PHP, \n  HTML, CSS, and JS at the time I've ventured into building my own such UI on the web and making something of a thin \n  client. This project is basically a revist of this idea just for fun and seeing what I have learned has changed how\n  I have created this in the beginning. You can enjoy the horribleness \n  <a target=\"_blank\" href=\"https://gitlab.com/BludotOS/BludotOS\">here</a>. \n  </p>\n  \n</div>\n";
var AboutContent = /** @class */ (function (_super) {
    __extends(AboutContent, _super);
    function AboutContent() {
        var _this = _super.call(this, "aboutcontent", "about-content") || this;
        var element = new DOMParser().parseFromString(content, "text/html").body.childNodes[0];
        _this.element.appendChild(element);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    padding: "1em 1em",
                    display: "block",
                    lineHeight: 1.5,
                    "& > div > h1": {
                        marginTop: 0
                    }
                },
                _a);
        };
        return _this;
    }
    return AboutContent;
}(OSElement));
export default AboutContent;
//# sourceMappingURL=index.js.map