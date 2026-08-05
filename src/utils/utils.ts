export function getWindowWidth() {
  return (
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth
  );
}

export function getWindowHeight() {
  return (
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight
  );
}

/**
 * The width below which the desktop layout stops fitting: the taskbar can no
 * longer hold a chip per window, and windows are better off filling the screen
 * than floating in it.
 *
 * Deliberately a width and not a user-agent test. The layout used to branch on
 * `is-mobile`, which meant a narrow desktop window kept the full desktop
 * taskbar and squeezed the name, the chips and the status into it, while a
 * tablet in landscape got the phone layout it had plenty of room to avoid.
 */
export const NARROW_PX = 760;

export const isNarrow = () => getWindowWidth() <= NARROW_PX;

/**
 * Toggle a class on an element whenever its own width crosses a threshold.
 *
 * A window's contents should size themselves against the window, not against
 * the screen: dragging a window narrow on a large monitor ought to reflow it
 * just as a phone would, and a media query can only answer "is the screen
 * small". CSS container queries say exactly this, but jss rejects `@container`
 * as an unknown rule, so the same job is done with an observer and a class.
 *
 * Measured on the border box, never the content box.
 *
 * The class it toggles usually changes padding, and padding comes out of the
 * content box: crossing the threshold would shrink the measurement, which
 * un-crosses it, which grows it again. That loop ran at frame rate and read as
 * the window flickering. The border box is fixed by the parent, so padding
 * cannot feed back into it.
 *
 * Returns a function that stops observing.
 */
export function observeWidth(
  el: HTMLElement,
  threshold: number,
  className = "is-narrow"
): () => void {
  if (typeof ResizeObserver === "undefined") {
    return () => undefined;
  }
  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const border = entry.borderBoxSize?.[0]?.inlineSize;
      const width = border ?? el.getBoundingClientRect().width;
      el.classList.toggle(className, width <= threshold);
    });
  });
  observer.observe(el, { box: "border-box" });
  return () => observer.disconnect();
}
