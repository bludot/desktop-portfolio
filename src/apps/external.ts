import windowManager from "../utils/windowManager";
import AppContent from "../contents/app";
import type Desktop from "../components/Desktop";

/**
 * The things that are running somewhere else.
 *
 * Beside the desktop's own applications rather than above them: `Settings` and
 * `FeatureFlags` next door are windows this codebase draws, and these are the
 * same idea pointed at somebody else's origin. A top-level `apps.ts` next to an
 * `apps/` directory also reads as a mistake every time either is imported.
 *
 * One list, read by both surfaces that offer them — the start menu's Apps group
 * and the launcher — so adding a fourth app is a single entry and the two can
 * never disagree about what exists.
 *
 * They open as windows on this desktop, in a frame, like any other window —
 * nothing here sends anyone off to another tab.
 *
 * Two things decide whether that works, and neither is in this repository. A
 * site may refuse to be framed at all (`X-Frame-Options`, or a
 * `frame-ancestors` list that does not name this origin), and a framed app is a
 * third-party context, so the cookie holding its session is a third-party
 * cookie and may be dropped — an app that is logged in elsewhere can appear
 * logged out in here. Both are settings on the app's own edge.
 *
 * Neither is recorded here. Framing permission used to be a flag on each entry,
 * and a flag is a claim about somebody else's headers that goes stale silently:
 * weeb.vip answered `X-Frame-Options: DENY` until it did not, and nothing in
 * here noticed. What an app's edge currently says is a question for its edge —
 *
 *   curl -sI https://weeb.vip | grep -i 'x-frame-options\|content-security'
 *
 * — and note that a `frame-ancestors` list naming the deployed origin will not
 * name a dev server, so an app can frame in production and refuse on
 * `localhost`. `contents/app` handles all of this at the window instead.
 */
export interface App {
  id: string;
  name: string;
  /** Shown under the name, and what someone would recognise the app by. */
  host: string;
  url: string;
  /** One line, in the app's own terms rather than its stack's. */
  blurb: string;
  /**
   * The app's own favicon, vendored under `public/apps`.
   *
   * Copied in rather than linked at their live URLs: two of the three do not
   * serve an icon from the path a browser guesses at — weeb.vip answers 500 for
   * `/favicon.ico` and keeps the real one under `/assets/icons` — so hotlinking
   * meant three cross-origin requests, each with its own way to fail, to draw
   * three 16px squares. Refresh them if an app is rebranded.
   */
  icon: string;
}

export const APPS: App[] = [
  {
    id: "weeb",
    name: "WeebVIP",
    host: "weeb.vip",
    url: "https://weeb.vip",
    blurb: "Anime tracking — schedules, watch lists and a catalogue.",
    icon: "/apps/weeb-vip.ico"
  },
  {
    id: "sakiyomi",
    name: "Sakiyomi",
    host: "sakiyomi.dev",
    url: "https://sakiyomi.dev",
    blurb: "Story point estimation for planning sessions.",
    icon: "/apps/sakiyomi.svg"
  },
  {
    id: "whisker",
    name: "Whisker",
    host: "whisker.kaimu.app",
    url: "https://whisker.kaimu.app",
    blurb: "A collaborative whiteboard on an infinite canvas.",
    icon: "/apps/whisker.svg"
  }
];

/**
 * Wide enough that the app inside believes it is on a desktop.
 *
 * A framed app reads the *frame's* width, not the screen's, so a window a
 * little too narrow serves the phone layout to somebody sitting at a monitor —
 * a hamburger in place of the navigation, one column, artwork dropped.
 *
 * 1024 is where it turns, measured rather than assumed: weeb.vip framed at
 * 1000px gives the hamburger, at 1024px the full navigation bar. That is the
 * common `lg` breakpoint and all three apps are built on it. The window was
 * 1000px wide, which missed it by 24 — near enough to look like a rendering
 * fault rather than a width.
 *
 * So: comfortably past it, not on it. The headroom is what stops a window
 * nudged smaller by a few pixels from collapsing the app to a phone.
 */
const DESKTOP_WIDTH = 1180;
const DESKTOP_HEIGHT = 780;

/**
 * Open one as a window on the desktop.
 *
 * Sized larger than the other windows because these are whole applications
 * with their own navigation rather than a page of prose, and clipped to the
 * viewport so the frame is never born larger than the screen it is on. On a
 * screen too small to hold the desktop layout the app gets its phone one,
 * which is the right answer there.
 */
export function openAppWindow(app: App, desktop: Desktop): void {
  windowManager.new({
    title: app.name,
    meta: app.host,
    content: new AppContent(app),
    desktop,
    dimensions: {
      width: Math.min(DESKTOP_WIDTH, Math.max(320, window.innerWidth - 80)),
      height: Math.min(DESKTOP_HEIGHT, Math.max(320, window.innerHeight - 140))
    },
    center: true
  });
}
