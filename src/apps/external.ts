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
  /**
   * Whether this app's edge permits this origin to frame it.
   *
   * Stated rather than detected, because it cannot be detected. A frame that
   * was refused and a frame that loaded perfectly are identical from here:
   * both fire `load`, neither exposes a readable document, and both report
   * zero child frames. The browser deliberately tells the embedder nothing, so
   * any runtime "is it blank?" check is a guess that will eventually accuse a
   * working app of being blocked.
   *
   * Measured from the response headers instead:
   *
   *   curl -sI https://weeb.vip | grep -i 'x-frame-options\|content-security'
   *
   * weeb.vip answers `X-Frame-Options: DENY`. Flip this to `true` once its
   * Cloudflare rule sends `frame-ancestors` naming this origin instead.
   */
  embeds: boolean;
}

export const APPS: App[] = [
  {
    id: "weeb",
    name: "WeebVIP",
    host: "weeb.vip",
    url: "https://weeb.vip",
    blurb: "Anime tracking — schedules, watch lists and a catalogue.",
    icon: "/apps/weeb-vip.ico",
    // X-Frame-Options: DENY at the Cloudflare edge, as of 2026-08-06.
    embeds: false
  },
  {
    id: "sakiyomi",
    name: "Sakiyomi",
    host: "sakiyomi.dev",
    url: "https://sakiyomi.dev",
    blurb: "Story point estimation for planning sessions.",
    icon: "/apps/sakiyomi.svg",
    embeds: true
  },
  {
    id: "whisker",
    name: "Whisker",
    host: "whisker.kaimu.app",
    url: "https://whisker.kaimu.app",
    blurb: "A collaborative whiteboard on an infinite canvas.",
    icon: "/apps/whisker.svg",
    embeds: true
  }
];

/**
 * Open one as a window on the desktop.
 *
 * Sized larger than the other windows because these are whole applications
 * with their own navigation rather than a page of prose, and clipped to the
 * viewport so the frame is never born larger than the screen it is on.
 */
export function openAppWindow(app: App, desktop: Desktop): void {
  windowManager.new({
    title: app.name,
    meta: app.host,
    content: new AppContent(app),
    desktop,
    dimensions: {
      width: Math.min(1000, Math.max(320, window.innerWidth - 80)),
      height: Math.min(700, Math.max(320, window.innerHeight - 140))
    },
    center: true
  });
}
