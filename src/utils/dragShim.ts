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
 * Cover the screen for the duration of a drag.
 *
 * `cursor` is the gesture's own — `grabbing` for a window being moved, the
 * matching arrow for whichever edge is being pulled.
 */
export function raiseDragShim(cursor = "default"): void {
  if (typeof document === "undefined") return;

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
