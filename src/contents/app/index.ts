import OSElement from "../../utils/OSElement";
import { color, font } from "../../theme";
import type { SplashRequest } from "../../components/Splash";
import type { App } from "../../apps/external";

/**
 * A whole product, in a window.
 *
 * Somebody else's application arriving over the network takes as long as it
 * takes, and until it does the frame is transparent — so without a cover the
 * window opens onto its own empty chrome and nothing says whether anything is
 * coming. That cover is the window's, not this file's: everything here declares
 * is what it is waiting for (`splash`) and when the wait is over (`ready`), and
 * `components/Splash` draws it the same way it draws every other window's.
 *
 * If the frame stays silent long enough, the cover turns into an explanation
 * rather than spinning forever. Which is the honest limit of what can be known
 * from in here, and worth being precise about:
 *
 *   - A frame that never answers — a host that is down, a request that hangs —
 *     never fires `load`, and that silence is the one failure this can see.
 *     After `PATIENCE_MS` the notice replaces the spinner.
 *   - A frame that is *refused* — `X-Frame-Options`, or a `frame-ancestors`
 *     list that does not name this origin — is not detectable. The browser
 *     swaps in its own error page, and that page loads: `load` fires almost at
 *     once, exactly as it would for a working app. Neither exposes a readable
 *     document, both report zero child frames. So a refused frame here reads as
 *     a fast load onto a blank window, and no timer will ever catch it.
 *
 * The second one is why nothing in this file guesses. A runtime "is it blank?"
 * check would eventually accuse a working app of being blocked, which is worse
 * than saying nothing.
 *
 * The frame is not sandboxed. These are the author's own applications rather
 * than arbitrary pages, and `sandbox` without `allow-same-origin` would cut
 * every one of them off from its own storage and cookies — which is to say
 * from being logged in, which is most of what they do.
 */

/**
 * How long a frame may stay silent before the cover stops promising it is
 * coming and starts explaining itself.
 *
 * Long enough that a slow app on a slow connection is not accused of being
 * broken, short enough that nobody watches a spinner wondering whether to wait.
 */
const PATIENCE_MS = 10_000;

class AppContent extends OSElement {
  private app: App;
  private frame!: HTMLIFrameElement;
  /** What this window's cover says, in place of the default. */
  readonly splash: SplashRequest;
  /** Settles when the frame stops being pending, however that happens. */
  readonly ready: Promise<void>;

  constructor(app: App) {
    super("appcontent", "app-content");
    this.app = app;

    this.style = () => ({
      [this.id]: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: color.chrome,
        fontFamily: font.ui,
        "& > iframe": {
          flex: "1 1 auto",
          width: "100%",
          border: "0",
          display: "block",
          minHeight: 0,
          // The app brings its own background; without this a light app flashes
          // dark on the way in, and a dark one flashes white.
          background: "transparent"
        }
      }
    });

    this.frame = document.createElement("iframe");
    this.frame.src = app.url;
    this.frame.title = app.name;
    this.frame.referrerPolicy = "strict-origin-when-cross-origin";
    this.frame.allow = "clipboard-write; fullscreen";

    /*
     * `load` fires for a page that arrived and for one the browser replaced
     * with an error page, so this is "the frame stopped being pending" rather
     * than "the app works". That is all the cover is waiting for: it is in the
     * way of whatever is underneath, and once anything is underneath it should
     * go. `error` is listened for too, though frames rarely fire it — a failed
     * navigation is the browser's own document, and it loads.
     */
    this.ready = new Promise<void>((resolve) => {
      this.frame.addEventListener("load", () => resolve(), { once: true });
      this.frame.addEventListener("error", () => resolve(), { once: true });
    });

    /*
     * Everything the default cannot know. The window would otherwise say
     * "Opening WeebVIP…" under a letter in a square, which is true but says
     * nothing about waiting on a network: the host is what somebody would
     * recognise, the app's own favicon is what it looks like, and the silence
     * of a frame is the one failure this window can explain.
     */
    this.splash = {
      icon: app.icon,
      initial: app.name,
      label: `Loading ${app.host}…`,
      patience: PATIENCE_MS,
      notice: () => ({
        /*
         * Names the app rather than blaming the desktop, offers the two things
         * somebody might actually want — the app itself, or this out of the way
         * — and stops short of asserting what went wrong, because from in here
         * that is genuinely unknown.
         */
        title: `${app.name} may not open in a window`,
        body: [
          `${app.host} has not answered this window yet. Some sites ask browsers not to display them inside another site, and others are simply slow — either way nothing is broken here, and the app is running normally at `,
          { code: app.host },
          "."
        ],
        actions: [
          { label: `Go to ${app.host} ↗`, href: app.url },
          { label: "Keep waiting", dismisses: true }
        ],
        dismissible: true
      })
    };

    this.element.appendChild(this.frame);
  }

  async beforeUnload() {
    // Pointed at nothing before the element goes, so a page mid-load stops
    // rather than finishing into a window that is already gone.
    this.frame.src = "about:blank";
  }
}

export default AppContent;
