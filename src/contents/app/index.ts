import OSElement from "../../utils/OSElement";
import motion, { prefersReducedMotion } from "../../utils/motion";
import { color, font, motion as timing, radius, size, weight } from "../../theme";
import type { App } from "../../apps/external";

/**
 * A whole product, in a window.
 *
 * Somebody else's application arriving over the network takes as long as it
 * takes, and until it does the frame is transparent — so without this the
 * window opens onto its own empty chrome and nothing says whether anything is
 * coming. A cover sits over the frame from the moment it is pointed at the app
 * and leaves when the frame says it has loaded.
 *
 * If the frame stays silent long enough, that cover turns into an explanation
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
  /** Whichever panel is currently over the frame: the spinner, or the notice. */
  private cover?: HTMLElement;
  private patience?: ReturnType<typeof setTimeout>;

  constructor(app: App) {
    super("appcontent", "app-content");
    this.app = app;

    this.style = () => ({
      "@keyframes app-spin": {
        from: { transform: "rotate(0deg)" },
        to: { transform: "rotate(360deg)" }
      },
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
        },
        // Over the frame, not beside it: when either panel goes it should
        // uncover whatever loaded rather than rearrange the window.
        "& > .app-cover, & > .app-notice": {
          position: "absolute",
          inset: "0",
          background: color.chrome,
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)"
        },

        "& > .app-cover": {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "13px"
        },
        "& .app-spinner": {
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: `2px solid ${color.line}`,
          borderTopColor: color.accent,
          animation: "$app-spin 760ms linear infinite"
        },
        /*
         * Nothing spins for somebody who asked for less movement. The ring
         * stays as a mark and the line below it carries the meaning, which it
         * has to anyway — a spinner alone never says what is loading.
         */
        "& .app-spinner.is-still": { animation: "none" },
        "@media (prefers-reduced-motion: reduce)": {
          "& .app-spinner": { animation: "none" }
        },
        "& .app-cover-note": {
          margin: "0",
          fontSize: size.bodyTight,
          color: color.inkSoft
        },

        "& > .app-notice": {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "11px",
          padding: "28px 30px"
        },
        "& .app-notice-title": {
          fontSize: size.heading,
          fontWeight: weight.announce,
          letterSpacing: "-.01em",
          color: color.ink,
          paddingRight: "34px"
        },
        "& .app-notice-body": {
          margin: "0",
          fontSize: size.bodyTight,
          lineHeight: 1.6,
          color: color.inkSoft,
          maxWidth: "58ch"
        },
        "& .app-notice code": {
          fontFamily: font.mono,
          fontSize: size.caption,
          padding: "1px 5px",
          borderRadius: "4px",
          background: color.chromeRaised
        },
        "& .app-notice-actions": { display: "flex", gap: "9px", marginTop: "4px" },
        "& .app-notice-actions > *": {
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 13px",
          borderRadius: radius.pill,
          border: "0",
          background: color.chromeRaised,
          color: color.ink,
          fontFamily: "inherit",
          fontSize: size.caption,
          fontWeight: weight.emphasise,
          textDecoration: "none",
          cursor: "pointer"
        },
        "& .app-notice-actions > *:hover": { color: color.accent },
        "& .app-notice-actions > *:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "2px"
        },
        // The corner dismiss, for somebody who wants the frame and not the
        // explanation. Same target size as a window control.
        "& .app-notice-close": {
          position: "absolute",
          top: "10px",
          right: "12px",
          width: "26px",
          height: "26px",
          display: "grid",
          placeItems: "center",
          border: "0",
          borderRadius: radius.control,
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.body,
          lineHeight: 1,
          cursor: "pointer"
        },
        "& .app-notice-close:hover": { background: color.hover, color: color.ink },
        "& .app-notice-close:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
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
    this.frame.addEventListener("load", () => this.reveal(), { once: true });
    this.frame.addEventListener("error", () => this.reveal(), { once: true });
    this.element.appendChild(this.frame);

    this.cover = this.buildCover();
    this.element.appendChild(this.cover);
    this.patience = setTimeout(() => this.giveUp(), PATIENCE_MS);
  }

  /** What sits over the frame while the app is on its way. */
  private buildCover(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "app-cover";
    // Polite, not assertive: an app arriving is not an interruption.
    panel.setAttribute("role", "status");
    panel.setAttribute("aria-live", "polite");

    const spinner = document.createElement("span");
    spinner.className = "app-spinner";
    /*
     * The media query covers a system asking for reduced motion; this covers
     * the desktop's own Settings toggle, which no media query can see.
     */
    if (prefersReducedMotion()) spinner.classList.add("is-still");
    spinner.setAttribute("aria-hidden", "true");

    const note = document.createElement("p");
    note.className = "app-cover-note";
    note.appendChild(document.createTextNode(`Loading ${this.app.host}…`));

    panel.append(spinner, note);
    return panel;
  }

  /**
   * What to say once the frame has gone quiet for long enough.
   *
   * Names the app rather than blaming the desktop, offers the two things
   * somebody might actually want — the app itself, or this out of the way —
   * and stops short of asserting what went wrong, because from in here that is
   * genuinely unknown.
   */
  private buildNotice(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "app-notice";
    panel.setAttribute("role", "status");

    const title = document.createElement("h2");
    title.className = "app-notice-title";
    title.appendChild(
      document.createTextNode(`${this.app.name} may not open in a window`)
    );

    const body = document.createElement("p");
    body.className = "app-notice-body";
    body.appendChild(
      document.createTextNode(
        `${this.app.host} has not answered this window yet. Some sites ask browsers not to display them inside another site, and others are simply slow — either way nothing is broken here, and the app is running normally at `
      )
    );
    const host = document.createElement("code");
    host.appendChild(document.createTextNode(this.app.host));
    body.appendChild(host);
    body.appendChild(document.createTextNode("."));

    const actions = document.createElement("div");
    actions.className = "app-notice-actions";

    const link = document.createElement("a");
    link.href = this.app.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.appendChild(document.createTextNode(`Go to ${this.app.host} ↗`));

    const anyway = document.createElement("button");
    anyway.type = "button";
    anyway.appendChild(document.createTextNode("Keep waiting"));
    anyway.addEventListener("click", () => this.dismiss());

    actions.append(link, anyway);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "app-notice-close";
    close.setAttribute("aria-label", "Dismiss this notice");
    close.appendChild(document.createTextNode("×"));
    close.addEventListener("click", () => this.dismiss());

    panel.append(close, title, body, actions);
    return panel;
  }

  /** Swap the spinner for the explanation. The frame carries on underneath. */
  private giveUp(): void {
    this.patience = undefined;
    if (!this.cover) return;

    this.cover.remove();
    this.cover = this.buildNotice();
    this.element.appendChild(this.cover);
  }

  /**
   * Take whatever is over the frame away, now that something is under it.
   *
   * This fires for the notice too: a frame that finally answers after the wait
   * ran out has proved the explanation wrong, and leaving it up would hide a
   * working app behind a paragraph about how it might not work.
   */
  private reveal(): void {
    this.stopWaiting();
    const panel = this.cover;
    if (!panel) return;
    this.cover = undefined;

    // Faded rather than cut, so an app that arrives quickly does not flash.
    void motion.fadeOut(panel, { duration: timing.fast }).then(() => panel.remove());
  }

  /** Take the notice away for good, uncovering the frame beneath it. */
  private dismiss(): void {
    this.cover?.remove();
    this.cover = undefined;
  }

  private stopWaiting(): void {
    if (this.patience === undefined) return;
    clearTimeout(this.patience);
    this.patience = undefined;
  }

  async beforeUnload() {
    // A window that has gone should not still be counting down towards a
    // notice, nor still fetching.
    this.stopWaiting();
    // Pointed at nothing before the element goes, so a page mid-load stops
    // rather than finishing into a window that is already gone.
    this.frame.src = "about:blank";
  }
}

export default AppContent;
