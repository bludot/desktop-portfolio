import { APPS } from "../../apps/external";
import { appMark } from "../AppIcon";

/**
 * Every mark on the desktop, in one place.
 *
 * There were three copies before this. The start menu drew each icon inline as
 * a parsed SVG string, the taskbar kept its own `GLYPHS` map keyed by window
 * title, and the launcher used the apps' favicons — so a destination could be
 * drawn one way in the menu and another in the chip, or, in the case of
 * Projects, drawn in one place and simply missing in the other. Nobody had done
 * anything wrong; there was just no single answer to "what does Projects look
 * like".
 *
 * This is that answer. One glyph per destination, drawn on the same 24-unit
 * grid at the same 1.7 stroke, taking its colour from whatever it sits in — so
 * a mark works on a chip, on a tile, and inside a window's splash without
 * knowing about any of them.
 *
 * The GitHub mark is the exception the set has to allow: it is somebody else's
 * logo, drawn as a filled path on a 16-unit grid, and redrawing it as strokes
 * to match would make it not their logo.
 */

export type IconName =
  | "about"
  | "experience"
  | "projects"
  | "contact"
  | "settings"
  | "debugger"
  | "flags"
  | "search"
  | "logout"
  | "chat"
  | "windows";

interface Mark {
  viewBox: string;
  /** Filled marks are logos; everything else is stroked to match the set. */
  filled?: boolean;
  body: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";

const MARKS: Record<IconName, Mark> = {
  about: {
    viewBox: "0 0 24 24",
    body: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>`
  },
  experience: {
    viewBox: "0 0 24 24",
    body: `<rect x="3" y="7.5" width="18" height="12.5" rx="1.6"/><path d="M8.5 7.5V6A1.5 1.5 0 0 1 10 4.5h4A1.5 1.5 0 0 1 15.5 6v1.5"/>`
  },
  projects: {
    viewBox: "0 0 16 16",
    filled: true,
    body: `<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0016 8c0-4.42-3.58-8-8-8z"/>`
  },
  contact: {
    viewBox: "0 0 24 24",
    body: `<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6.5 9 6 9-6"/>`
  },
  settings: {
    viewBox: "0 0 24 24",
    body: `<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>`
  },
  debugger: {
    viewBox: "0 0 24 24",
    body: `<path d="m5.5 8.5 4 3.5-4 3.5M12.5 16h6"/>`
  },
  flags: {
    viewBox: "0 0 24 24",
    body: `<path d="M5 21V4.5M5 5.2h11.5l-2 3.4 2 3.4H5"/>`
  },
  search: {
    viewBox: "0 0 16 16",
    body: `<circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4 14 14"/>`
  },
  logout: {
    viewBox: "0 0 24 24",
    body: `<path d="M13 3v9"/><path d="M7.5 6.4a8 8 0 1 0 9 0"/>`
  },
  chat: {
    viewBox: "0 0 24 24",
    body: `<path d="M20.5 12.4c0 3.9-3.8 7-8.5 7a10 10 0 0 1-2.4-.3L4.5 21l1.2-3.5A6.6 6.6 0 0 1 3.5 12.4c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z"/>`
  },
  windows: {
    viewBox: "0 0 24 24",
    body: `<rect x="3" y="4" width="8" height="7" rx="1.4"/><rect x="13" y="4" width="8" height="7" rx="1.4"/><rect x="3" y="13" width="8" height="7" rx="1.4"/><rect x="13" y="13" width="8" height="7" rx="1.4"/>`
  }
};

/**
 * One mark, sized by whatever it is put in.
 *
 * No width or height is set here on purpose: every surface that uses these has
 * its own idea of how big an icon is, and a stylesheet rule beats an attribute
 * an element brought with it. The namespace is not decoration — parsed as XML
 * without it the tag is an element called "svg" in no namespace at all, which
 * the browser lays out and then draws nothing inside.
 */
export function icon(name: IconName): SVGElement {
  const mark = MARKS[name];
  const paint = mark.filled
    ? `fill="currentColor"`
    : `fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`;

  const markup = `<svg xmlns="${SVG_NS}" viewBox="${mark.viewBox}" ${paint} aria-hidden="true">${mark.body}</svg>`;
  return new DOMParser().parseFromString(markup, "image/svg+xml")
    .documentElement as unknown as SVGElement;
}

/**
 * Which glyph a window's title stands for.
 *
 * Titles are what the desktop actually has to go on: a taskbar chip is handed a
 * window, and a window knows what it is called and nothing else about itself.
 * Anything unrecognised gets nothing rather than a guess — a wrong icon reads
 * as a bug in a way that no icon does not.
 */
const BY_TITLE: Record<string, IconName> = {
  About: "about",
  Experience: "experience",
  Projects: "projects",
  Settings: "settings",
  Debugger: "debugger",
  Chat: "chat",
  FeatureFlagsApp: "flags"
};

/**
 * The mark for an open window, whatever kind it is.
 *
 * Apps are drawn with their own favicon rather than a glyph from this set —
 * that is what somebody recognises WeebVIP by, and it is the app's identity
 * rather than the desktop's.
 */
export function markFor(title: string, size = 14): Element | undefined {
  const app = APPS.find((entry) => entry.name === title);
  if (app) return appMark(app, size);

  const name = BY_TITLE[title];
  return name ? icon(name) : undefined;
}

export default icon;
