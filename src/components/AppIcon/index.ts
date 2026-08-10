import { font } from "../../theme";
import type { App } from "../../apps/external";

/**
 * An app's own favicon, with somewhere to fall back to.
 *
 * A favicon is somebody else's file: it can be missing, malformed, or replaced
 * with something that fails to decode, and a broken-image glyph in a menu looks
 * like the desktop is broken rather than the icon. When one does not load, its
 * initial in a tinted square takes its place — which is a real mark, not an
 * apology for a missing one.
 */
export function appMark(app: App, size = 20): HTMLElement {
  const box = document.createElement("span");
  box.className = "app-icon";
  box.setAttribute("aria-hidden", "true");
  box.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    "flex:0 0 auto",
    "display:inline-grid",
    "place-items:center",
    "overflow:hidden",
    "border-radius:5px"
  ].join(";");

  const img = document.createElement("img");
  img.src = app.icon;
  img.alt = "";
  img.width = size;
  img.height = size;
  // Decoded off the main thread; nothing here waits on it.
  img.loading = "lazy";
  img.decoding = "async";
  img.style.cssText = `width:${size}px;height:${size}px;object-fit:contain;display:block`;

  img.addEventListener(
    "error",
    () => {
      img.remove();
      const letter = document.createElement("span");
      letter.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        "display:grid",
        "place-items:center",
        "border-radius:5px",
        "background:var(--chrome-raised)",
        "color:var(--ink-soft)",
        `font-family:${font.mono}`,
        `font-size:${Math.round(size * 0.55)}px`,
        "font-weight:600"
      ].join(";");
      letter.appendChild(document.createTextNode(app.name.slice(0, 1)));
      box.appendChild(letter);
    },
    { once: true }
  );

  box.appendChild(img);
  return box;
}

/**
 * The same mark, with the gutter a menu row wants.
 *
 * Every icon in the start menu is an inline SVG carrying `margin: 0 10px`, so a
 * favicon without it sits hard against the panel edge and its label starts
 * 10px left of every other label — one row visibly out of line with the rest.
 * Surfaces that do their own spacing — a taskbar chip, a springboard tile —
 * want `appMark` instead.
 */
export function appIcon(app: App, size = 20): HTMLElement {
  const box = appMark(app, size);
  box.style.margin = "0 10px";
  return box;
}

export default appIcon;
