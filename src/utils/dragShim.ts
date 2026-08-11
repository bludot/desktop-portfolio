/**
 * A sheet over the whole screen, for as long as something is being dragged.
 *
 * A drag is a press here and a stream of moves *anywhere* — which is why every
 * drag on this desktop listens on `window` rather than on the thing it grabbed.
 * That works right up until the pointer crosses an `<iframe>`.
 *
 * A cross-origin frame is a separate document with its own event loop. Once the
 * pointer is over it, mouse events are delivered to *its* window and the
 * embedding page hears nothing: the moves stop arriving mid-gesture, so the
 * window stops following the cursor, and the release lands in there too, so the
 * `mouseup` that would have ended the drag never comes. The drag is left
 * running, and the next click on the desktop finishes it somewhere unintended.
 *
 * Nothing can be done from inside the frame — see `contents/app`, which is the
 * same wall for the same reason. So the frame is covered instead. One
 * transparent element over everything means the pointer never actually enters a
 * frame for the length of the gesture, every move and the release stay in this
 * document, and it comes off the moment the drag ends.
 *
 * It also carries the cursor. Without that, a resize that wanders off the 6px
 * border flickers back to whatever is underneath — a text caret over prose, a
 * pointer over a link — while the resize is still very much happening. Holding
 * the gesture's own cursor on the sheet keeps it steady across the whole screen.
 */

/**
 * Above every window, the taskbar and the overview, below the launcher and the
 * bootscreen — neither of which can be open while something is being dragged.
 */
const SHIM_Z = 9500;

/** One element, reused. A drag is a single gesture; there is never a second. */
let shim: HTMLElement | undefined;

/**
 * Whether a gesture is in progress, for anything that should stand aside.
 *
 * The sheet is over the whole screen while it is up, so nothing underneath can
 * be hovered, pressed or pointed at. Work that exists to answer the pointer —
 * hover states, reveal effects, anything measuring where the cursor is relative
 * to something — is not merely wasted for the length of a drag, it is wasted at
 * the exact moment the main thread has the least to spare.
 */
export function dragging(): boolean {
  return !!shim?.isConnected;
}

/**
 * Cover the screen for the duration of a drag.
 *
 * Call this from the first *move*, never from the press.
 *
 * A press is not yet a drag — most of them are clicks, and the buttons on this
 * desktop act on `click`, which the browser only fires when the press and the
 * release land on the same element. A sheet raised on mousedown catches the
 * release instead, so the click never happens: window controls stopped closing
 * windows the moment their titlebar was pressed, because the titlebar is what
 * raised the sheet over them. Raising on movement means a gesture that turns
 * out to be a click never sees one.
 *
 * `cursor` is the gesture's own — `grabbing` for a window being moved, the
 * matching arrow for whichever edge is being pulled. Cheap to call on every
 * move: it returns immediately once the sheet is up and showing that cursor.
 */
export function raiseDragShim(cursor = "default"): void {
  if (typeof document === "undefined") return;
  if (shim?.isConnected && shim.style.cursor === cursor) return;

  if (!shim) {
    shim = document.createElement("div");
    shim.className = "drag-shim";
    // Nothing to announce: it is a way of holding on to the pointer, not a
    // thing on the screen.
    shim.setAttribute("aria-hidden", "true");
    shim.style.cssText = [
      "position:fixed",
      "inset:0",
      `z-index:${SHIM_Z}`,
      // Left unpainted — it is here to catch the pointer, not to be seen. No
      // global rule paints a bare div, so there is nothing to override.
      // A drag that selects text as it goes leaves a blue smear behind it.
      "user-select:none",
      "-webkit-user-select:none"
    ].join(";");
  }

  shim.style.cursor = cursor;
  document.body.appendChild(shim);

  /*
   * The sheet takes itself down on the next release, whatever happens upstream.
   *
   * Every caller drops it on their own `mouseup` already, and this is the
   * backstop for when that never arrives — a handler removed early, a gesture
   * abandoned, a caller added later that forgets. The failure it guards against
   * is not a small one: a sheet left up covers the desktop at z-index 9500 and
   * silently eats every click on it, which reads as the whole page having died.
   *
   * On capture, so it runs before the drag's own release handler rather than
   * racing it, and `once`, so it never accumulates across gestures.
   */
  window.addEventListener("mouseup", dropDragShim, { capture: true, once: true });
}

/**
 * Uncover the screen.
 *
 * Safe to call when no shim is up — every release path calls it, including the
 * ones that never raised one.
 */
export function dropDragShim(): void {
  shim?.remove();
}
