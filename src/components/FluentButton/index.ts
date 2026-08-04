interface FluentButtonOptions {
  text?: string;
  icon?: string;
  outerReveal?: boolean;
  onClick?: (event: MouseEvent) => void;
}

/** Only the bits of an element these handlers touch, so plain objects work too. */
interface RevealTarget {
  offsetLeft: number;
  offsetTop: number;
  style: CSSStyleDeclaration;
  classList: DOMTokenList;
}

interface Dimensions {
  width: number;
  height: number;
}

class FluentButton {
  rootEl: HTMLElement;
  el!: HTMLElement;

  constructor(rootEl: HTMLElement | string, { text, icon, outerReveal, onClick }: FluentButtonOptions) {
    this.rootEl =
      typeof rootEl === "string"
        ? (document.querySelector(rootEl) as HTMLElement)
        : rootEl;
    if (FluentButton.elements.has(this.rootEl)) return;
    FluentButton.elements.add(this.rootEl);

    this.rootEl.innerHTML = FluentButton.createHTML({ text, icon });
    this.el = this.rootEl.firstElementChild as HTMLElement;

    // These handlers read only `currentTarget`, so they are declared against a
    // structural shape rather than a DOM event; widen them at the wiring points.
    const asListener = (fn: (arg: any) => unknown) => fn as EventListener;

    if (onClick) this.el.addEventListener("click", onClick as EventListener);
    this.el.addEventListener("touchstart", asListener(this.startRipple));
    this.el.addEventListener("mousedown", asListener(this.startRipple));
    this.el.onmousedown = this.el.ontouchstart = asListener(this.addPressedState);
    this.el.onmouseup = this.el.onmouseleave = this.el.ontouchend = asListener(
      this.removePressedState
    );

    if (!outerReveal) this.el.onmousemove = asListener(this.updateCoordinates);
    else {
      FluentButton.outerRevealElements.set(
        this.el,
        this.getElementDimensions(this.el)
      );
      if (!FluentButton.observingOuterReveal) this.observeOuterReveal();
    }
  }

  updateCoordinates({ pageX, pageY, currentTarget }: { pageX: number; pageY: number; currentTarget: RevealTarget }) {
    const x = pageX - currentTarget.offsetLeft;
    const y = pageY - currentTarget.offsetTop;

    currentTarget.style.setProperty("--x", `${x}px`);
    currentTarget.style.setProperty("--y", `${y}px`);

    return { x, y };
  }

  startRipple({ currentTarget }: { currentTarget: RevealTarget }) {
    currentTarget.classList.remove("fluent-btn--ripple"); // remove prev
    // Add again to (re)start animation
    setTimeout(() => currentTarget.classList.add("fluent-btn--ripple"), 25);
  }
  addPressedState({ currentTarget }: { currentTarget: RevealTarget }) {
    currentTarget.classList.add("fluent-btn--pressed");
  }
  removePressedState({ currentTarget }: { currentTarget: RevealTarget }) {
    currentTarget.classList.remove("fluent-btn--pressed");
  }

  observeOuterReveal() {
    FluentButton.observingOuterReveal = true;

    window.addEventListener("resize", this.updateElementDimensions.bind(this));
    window.addEventListener("mousemove", (event) => {
      window.requestAnimationFrame(this.updateOuterReveal.bind(this, event));
    });
    window.addEventListener("touchmove", ({ touches }) => {
      // @ts-ignore
      const [{ clientX, clientY }] = touches;
      const position = { pageX: clientX, pageY: clientY };
      window.requestAnimationFrame(this.updateOuterReveal.bind(this, position));
    });
  }

  updateOuterReveal({ pageX, pageY }: { pageX: number; pageY: number }) {
    // @ts-ignore
    for (const [el, { width, height }] of FluentButton.outerRevealElements) {
      const { x, y } = this.updateCoordinates({
        pageX,
        pageY,
        currentTarget: el
      });

      if (this.isInRevealThreshold({ x, y, width, height })) {
        el.classList.add("fluent-btn--reveal");
      } else {
        el.classList.remove("fluent-btn--reveal");
      }
    }
  }

  isInRevealThreshold({ x, y, width, height }: { x: number; y: number } & Dimensions) {
    const threshold = FluentButton.outerRevealThreshold;
    return (
      x > -threshold &&
      x < width + threshold &&
      y > -threshold &&
      y < height + threshold
    );
  }

  getElementDimensions(el: Element): Dimensions {
    const { width, height } = el.getBoundingClientRect();
    return { width, height };
  }
  updateElementDimensions() {
    // @ts-ignore
    for (const [el] of FluentButton.outerRevealElements) {
      FluentButton.outerRevealElements.set(el, this.getElementDimensions(el));
    }
  }

  destroy() {
    this.rootEl.innerHTML = "";
    FluentButton.outerRevealElements.delete(this.el);
    FluentButton.elements.delete(this.rootEl);
  }

  static elements = new Set<HTMLElement>();
  static outerRevealElements = new Map<HTMLElement, Dimensions>();
  static outerRevealThreshold = 75;
  static observingOuterReveal = false;

  static createHTML = ({ text, icon }: FluentButtonOptions) => `
    <div class="fluent-btn">
      <button class="fluent-btn__btn">
        <span class="fluent-btn__icon" style="background-image: url(${icon})"></span>
        <span class="fluent-btn__txt">${text}</span>
      </button>
    </div>`;
}
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
