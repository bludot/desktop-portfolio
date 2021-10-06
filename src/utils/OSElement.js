import jss from "jss";
var OSElement = /** @class */ (function () {
    function OSElement(tagName, id) {
        this.element = document.createElement(tagName);
        this.element.id = this.id = id;
    }
    OSElement.prototype.applyStyle = function () {
        if (this.styleSheet) {
            this.styleSheet.detach();
        }
        this.styleSheet = jss.createStyleSheet(this.style());
        var classes = this.styleSheet.attach().classes;
        this.element.className += " " + classes[this.id];
    };
    OSElement.prototype.unloadStyle = function () {
        if (this.styleSheet) {
            this.styleSheet.detach();
            this.styleSheet = null;
        }
    };
    OSElement.prototype.load = function (element) {
        if (this.parent) {
            throw new Error("Already loaded! did you mean to reload?");
        }
        this.parent = element;
        if (this.className) {
            this.element.className = this.className;
        }
        this.applyStyle();
        this.parent.appendChild(this.element);
    };
    OSElement.prototype.unload = function () {
        this.parent.removeChild(this.element);
        this.parent = null;
        this.unloadStyle();
    };
    OSElement.prototype.reload = function () {
        var tmpParent = this.parent;
        this.unload();
        this.load(tmpParent);
        this.applyStyle();
    };
    OSElement.prototype.getElement = function () {
        return this.element;
    };
    return OSElement;
}());
export default OSElement;
//# sourceMappingURL=OSElement.js.map