var FluentButton = /** @class */ (function () {
    function FluentButton(rootEl, _a) {
        var text = _a.text, icon = _a.icon, outerReveal = _a.outerReveal, onClick = _a.onClick;
        this.rootEl =
            typeof rootEl === "string" ? document.querySelector(rootEl) : rootEl;
        if (FluentButton.elements.has(this.rootEl))
            return;
        FluentButton.elements.add(this.rootEl);
        this.rootEl.innerHTML = FluentButton.createHTML({ text: text, icon: icon });
        this.el = this.rootEl.firstElementChild;
        if (onClick)
            this.el.addEventListener("click", onClick);
        this.el.addEventListener("touchstart", this.startRipple);
        this.el.addEventListener("mousedown", this.startRipple);
        this.el.onmousedown = this.el.ontouchstart = this.addPressedState;
        this.el.onmouseup = this.el.onmouseleave = this.el.ontouchend = this.removePressedState;
        if (!outerReveal)
            this.el.onmousemove = this.updateCoordinates;
        else {
            FluentButton.outerRevealElements.set(this.el, this.getElementDimensions(this.el));
            if (!FluentButton.observingOuterReveal)
                this.observeOuterReveal();
        }
    }
    FluentButton.prototype.updateCoordinates = function (_a) {
        var pageX = _a.pageX, pageY = _a.pageY, currentTarget = _a.currentTarget;
        var x = pageX - currentTarget.offsetLeft;
        var y = pageY - currentTarget.offsetTop;
        currentTarget.style.setProperty("--x", x + "px");
        currentTarget.style.setProperty("--y", y + "px");
        return { x: x, y: y };
    };
    FluentButton.prototype.startRipple = function (_a) {
        var currentTarget = _a.currentTarget;
        currentTarget.classList.remove("fluent-btn--ripple"); // remove prev
        // Add again to (re)start animation
        setTimeout(function () { return currentTarget.classList.add("fluent-btn--ripple"); }, 25);
    };
    FluentButton.prototype.addPressedState = function (_a) {
        var currentTarget = _a.currentTarget;
        currentTarget.classList.add("fluent-btn--pressed");
    };
    FluentButton.prototype.removePressedState = function (_a) {
        var currentTarget = _a.currentTarget;
        currentTarget.classList.remove("fluent-btn--pressed");
    };
    FluentButton.prototype.observeOuterReveal = function () {
        var _this = this;
        FluentButton.observingOuterReveal = true;
        window.addEventListener("resize", this.updateElementDimensions.bind(this));
        window.addEventListener("mousemove", function (event) {
            window.requestAnimationFrame(_this.updateOuterReveal.bind(_this, event));
        });
        window.addEventListener("touchmove", function (_a) {
            var touches = _a.touches;
            // @ts-ignore
            var _b = touches[0], clientX = _b.clientX, clientY = _b.clientY;
            var position = { pageX: clientX, pageY: clientY };
            window.requestAnimationFrame(_this.updateOuterReveal.bind(_this, position));
        });
    };
    FluentButton.prototype.updateOuterReveal = function (_a) {
        var pageX = _a.pageX, pageY = _a.pageY;
        // @ts-ignore
        for (var _i = 0, _b = FluentButton.outerRevealElements; _i < _b.length; _i++) {
            var _c = _b[_i], el = _c[0], _d = _c[1], width = _d.width, height = _d.height;
            var _e = this.updateCoordinates({
                pageX: pageX,
                pageY: pageY,
                currentTarget: el
            }), x = _e.x, y = _e.y;
            if (this.isInRevealThreshold({ x: x, y: y, width: width, height: height })) {
                el.classList.add("fluent-btn--reveal");
            }
            else {
                el.classList.remove("fluent-btn--reveal");
            }
        }
    };
    FluentButton.prototype.isInRevealThreshold = function (_a) {
        var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        var threshold = FluentButton.outerRevealThreshold;
        return (x > -threshold &&
            x < width + threshold &&
            y > -threshold &&
            y < height + threshold);
    };
    FluentButton.prototype.getElementDimensions = function (el) {
        var _a = el.getBoundingClientRect(), width = _a.width, height = _a.height;
        return { width: width, height: height };
    };
    FluentButton.prototype.updateElementDimensions = function () {
        // @ts-ignore
        for (var _i = 0, _a = FluentButton.outerRevealElements; _i < _a.length; _i++) {
            var el = _a[_i][0];
            FluentButton.outerRevealElements.set(el, this.getElementDimensions(el));
        }
    };
    FluentButton.prototype.destroy = function () {
        this.rootEl.innerHTML = "";
        FluentButton.outerRevealElements["delete"](this.el);
        FluentButton.elements["delete"](this.rootEl);
    };
    FluentButton.elements = new Set();
    FluentButton.outerRevealElements = new Map();
    FluentButton.outerRevealThreshold = 75;
    FluentButton.observingOuterReveal = false;
    FluentButton.createHTML = function (_a) {
        var text = _a.text, icon = _a.icon;
        return "\n    <div class=\"fluent-btn\">\n      <button class=\"fluent-btn__btn\">\n        <span class=\"fluent-btn__icon\" style=\"background-image: url(" + icon + ")\"></span>\n        <span class=\"fluent-btn__txt\">" + text + "</span>\n      </button>\n    </div>";
    };
    return FluentButton;
}());
/*
document.querySelectorAll("[data-fluent-text]").forEach((element) => {
  new FluentButton(element, {
    text: element.dataset.fluentText,
    icon: element.dataset.fluentIcon,
    outerReveal: true,
    onClick: () => (headingEl.textContent = element.dataset.fluentText)
  });
});
*/
export default FluentButton;
//# sourceMappingURL=index.js.map