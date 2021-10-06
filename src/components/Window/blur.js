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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import OSElement from "../../utils/OSElement";
import { getSupport } from "./../../utils/support";
import settings from "../../utils/settings";
var support = getSupport();
var WindowBlur = /** @class */ (function (_super) {
    __extends(WindowBlur, _super);
    function WindowBlur(blur, radius) {
        var _this = _super.call(this, "Windowblur", "window-blur") || this;
        _this.blur = 30;
        _this.radius = 8;
        _this.blur = blur;
        _this.radius = radius;
        _this.style = function () {
            var _a;
            return (_a = {},
                _a[_this.id] = __assign(__assign({}, (!support.css.backdropFilter && {
                    /*overflow: "hidden",
                    "&::before": {
                      content: "''",
                      position: "absolute",
                      top: "-100px",
                      left: "-500px",
                      right: "-100px",
                      bottom: "-100px",
                      
                      backgroundImage: `url(${settings.getDesktopImage().original})`,
                      backgroundRepeat: "no-repeat",
                      backgroundAttachment: "fixed",
                      backgroundSize: "cover",
                      
                      // background: "-moz-element(#desktop) no-repeat",
                      filter: "blur(60px)",
                      zIndex: "-1"
                    }*/
                    "&:before": {
                        content: "''",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundPosition: "center",
                        backgroundImage: "url('" + (_this.blur === 30
                            ? settings.getDesktopImage().blurred30
                            : settings.getDesktopImage().blurred60) + "')",
                        backgroundAttachment: "fixed",
                        backgroundSize: "cover",
                        borderRadius: _this.radius + "px"
                    },
                    "&:after": {
                        content: "''",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(200,200,200, .5)",
                        borderRadius: _this.radius + "px"
                    }
                })), { position: "absolute", borderRadius: _this.radius + "px", top: 0, bottom: 0, left: 0, right: 0, backdropFilter: "blur(35px)" }),
                _a);
        };
        return _this;
    }
    return WindowBlur;
}(OSElement));
/*
class WindowBlur extends OSElement {
  constructor() {
    super("Windowblur", "window-blur");
    this.style = () => ({
      [this.id]: {
        ...(!support.css.backdropFilter && {
          "&:before": {
            content: "''",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            filter: "blur(35px)",
            backgroundPosition: "center",
            background:
              "url(https://images.pexels.com/photos/15382/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260) fixed",
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
            margin: "-999px"
          }
        }),
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backdropFilter: "blur(35px)"
      }
    });
  }
}
*/
export default WindowBlur;
//# sourceMappingURL=blur.js.map