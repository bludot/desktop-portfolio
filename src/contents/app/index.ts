import OSElement from "../../utils/OSElement";
import { color, font, radius, size, weight } from "../../theme";
import type { App } from "../../apps/external";

/**
 * A whole product, in a window.
 *
 * The frame is always built and always pointed at the app, even for one whose
 * headers currently refuse to be framed. `App.embeds` only decides whether a
 * notice is laid over the top, and that notice can be dismissed to uncover
 * whatever the frame did manage to load.
 *
 * That indirection is the point. Whether an app can be framed is a setting on
 * its own edge, changeable without touching this repository, and it cannot be
 * detected from in here — a refused frame and a working one are identical to
 * JavaScript: both fire `load`, neither exposes a readable document, both
 * report zero child frames. So the flag is a claim about the outside world that
 * may quietly go stale, and dismissing the notice is how somebody finds out it
 * has: if the header was fixed and nobody updated the flag, the app is running
 * underneath the whole time.
 *
 * The frame is not sandboxed. These are the author's own applications rather
 * than arbitrary pages, and `sandbox` without `allow-same-origin` would cut
 * every one of them off from its own storage and cookies — which is to say
 * from being logged in, which is most of what they do.
 */
class AppContent extends OSElement {
  private app: App;
  private frame!: HTMLIFrameElement;
  private notice?: HTMLElement;

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
        },
        // Over the frame, not beside it: dismissing it should uncover whatever
        // loaded rather than rearrange the window.
        "& > .app-notice": {
          position: "absolute",
          inset: "0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "11px",
          padding: "28px 30px",
          background: color.chrome,
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)"
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
    this.element.appendChild(this.frame);

    if (!app.embeds) {
      this.notice = this.buildNotice();
      this.element.appendChild(this.notice);
    }
  }

  /**
   * What to show over an app that is expected to refuse the frame.
   *
   * Names the app rather than blaming the desktop, and offers the two things
   * somebody might actually want: the app itself, or this out of the way.
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
        `${this.app.host} asks browsers not to display it inside another site, so this window is likely to stay blank. Nothing is broken here — the app is running normally at `
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
    anyway.appendChild(document.createTextNode("Show it anyway"));
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

  /** Take the notice away for good, uncovering the frame beneath it. */
  private dismiss(): void {
    this.notice?.remove();
    this.notice = undefined;
  }

  async beforeUnload() {
    // Pointed at nothing before the element goes, so a page mid-load stops
    // rather than finishing into a window that is already gone.
    this.frame.src = "about:blank";
  }
}

export default AppContent;
