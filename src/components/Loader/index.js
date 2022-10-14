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
import { v4 as uuidv4 } from 'uuid';
var Loader = /** @class */ (function (_super) {
    __extends(Loader, _super);
    function Loader() {
        var _this = _super.call(this, 'loader', "Loader_" + uuidv4().replace(/-/g, "")) || this;
        _this.style = function () {
            var _a;
            return (_a = {
                    "@keyframes lds-dual-ring": {
                        from: {
                            transform: "rotate(0deg)"
                        },
                        to: {
                            transform: "rotate(360deg)"
                        }
                    }
                },
                _a[_this.id] = {
                    display: "inline-block",
                    width: "80px",
                    height: "80px",
                    padding: "20px",
                    flex: "0 1 auto",
                    "&:after": {
                        content: "''",
                        display: "block",
                        width: "64px",
                        height: "64px",
                        margin: "8px",
                        borderRadius: "50%",
                        border: "6px solid #000",
                        borderColor: "#ccc transparent #ccc transparent",
                        animation: "$lds-dual-ring 1.2s linear infinite"
                    }
                },
                _a);
        };
        return _this;
    }
    return Loader;
}(OSElement));
export default Loader;
//# sourceMappingURL=index.js.map