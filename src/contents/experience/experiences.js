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
import { format } from 'date-fns';
var locationSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 384 512\" width=\"12\" height=\"12\"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d=\"M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z\"/></svg>";
var content = function (_a) {
    var position = _a.position, company = _a.company, location = _a.location, description = _a.description, start = _a.start, end = _a.end;
    return "\n  <div>\n    <h2>" + position + "</h2>\n    <h3>" + company + "</h3>\n    \n    <div class=\"flex\">\n        <div>\n            <span>" + format(start, "MM/yyyy") + "</span> - <span>" + (typeof end == "string" ? end : format(end, "MM/yyyy")) + "</span>\n        </div>\n        <div>\n             \n            <span>" + locationSVG + " " + location + "</span>\n        </div>\n    </div>\n    <ul>" + description.map(function (item) { return "<li>" + item + "</li>"; }).join("") + "</ul>\n  </div>\n    \n";
};
var ExperiencesContent = /** @class */ (function (_super) {
    __extends(ExperiencesContent, _super);
    function ExperiencesContent(experience) {
        var _this = _super.call(this, "experiencecomponent", "experience-component") || this;
        var element = new DOMParser().parseFromString(content(experience), "text/html").body.childNodes[0];
        _this.element.appendChild(element);
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = {
                    color: "#333",
                    "& > div > *": {
                        paddingBottom: "0.25em !important"
                    },
                    "& h2": {
                        padding: "0",
                        margin: "0",
                        fontWeight: 300
                    },
                    "& h3": {
                        padding: "0",
                        margin: "0"
                    },
                    "& .flex": {
                        display: "flex"
                    },
                    "& .flex > div": {
                        flex: "auto 1 0"
                    },
                    "& .flex > div:nth-child(2)": {
                        textAlign: "right"
                    },
                    "& ul": {
                        paddingLeft: "1em"
                    },
                    "& ul li": {
                        padding: "0.25em 0"
                    },
                    "& .flex svg > path": {
                        fill: "#738dff"
                    }
                },
                _a);
        };
        return _this;
    }
    return ExperiencesContent;
}(OSElement));
export { ExperiencesContent as default };
//# sourceMappingURL=experiences.js.map