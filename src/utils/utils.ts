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
