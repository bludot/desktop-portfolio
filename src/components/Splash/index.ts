import OSElement from "../../utils/OSElement";
// @ts-ignore -- uuid v8 ships no types and @types/uuid targets a newer API
import { v4 as uuidv4 } from "uuid";
import { color, font, motion as timing, radius, size, weight } from "../../theme";
import motion, { prefersReducedMotion } from "../../utils/motion";

/**
 * What a window shows while its content is on its way.
 *
 * Every window on this desktop opens instantly and fills in afterwards — the
 * frame is there before the app inside it, the repository list before GitHub
 * has answered — so each one had to decide for itself what to put in the gap.
 * The apps grew a cover with a spinner and a name; Projects wrote "Reading
 * GitHub…" into the empty pane; everything else showed nothing at all and
 * opened onto its own chrome. Three answers to one question, and only one of
 * them any good.
 *
 * So this is the one answer, and the window mounts it rather than the content:
 * anything opened in a window gets the same cover, in the same place, with the
 * same movement, for saying when it is ready (`ready`) and nothing else. What
 * it looks like is the window's title until the content says otherwise, and a
 * content that has something better to offer — its own mark, its own words, an
 * explanation for a wait that has gone on too long — overrides that piece by
 * piece, or turns the whole thing off with `splash: false`. See
 * `SplashfulContent` and `resolveSplash` below.
 *
 * The cover sits over the content area and never over the titlebar. A window
 * whose content never arrives must still be closable, and the one control that
 * closes it is up there.
 *
 * A wait that goes on too long can stop promising and start explaining. That is
 * `patience` and `notice`: the spinner is replaced by something that says what
 * is known, and offers whatever there is to do about it. The frame — or the
 * fetch, or whatever else is underneath — carries on regardless, and if it
 * arrives after the explanation, the explanation goes: leaving it up would hide
 * a working window behind a paragraph about how it might not work.
 */

/**
 * A run of notice text. Plain strings, with the occasional literal — a host, a
 * path, a command — that should be set apart from the prose around it.
 */
export type NoticePart = string | { code: string };

/** Something to do about a wait that has gone on too long. */
export interface SplashAction {
  label: string;
  /** Somewhere to go instead, opened in its own tab. */
  href?: string;
  onSelect?: () => void;
  /** Whether pressing it also takes the cover away. */
  dismisses?: boolean;
}

/** What replaces the spinner once patience has run out. */
export interface SplashNotice {
  title: string;
  body: NoticePart[];
  actions?: SplashAction[];
  /** A corner dismiss, for somebody who wants what is underneath regardless. */
  dismissible?: boolean;
}

export interface SplashSpec {
  /**
   * The line under the mark, naming what is being waited for.
   *
   * A spinner on its own says only that something is happening. "Loading
   * weeb.vip…" says what, which is the part worth reading.
   */
  label: string;
  /**
   * The mark above it: a URL to an image — an app's own favicon — or a node the
   * content draws itself, for anything without one. `Element`, not
   * `HTMLElement`: a drawn mark is usually an SVG, which is neither.
   */
  icon?: string | Element;
  /** Stands in for an image that will not load. Usually a first letter. */
  initial?: string;
  /** How long the wait may go on before it explains itself. Omit for never. */
  patience?: number;
  /**
   * What to say when it has. Built on demand rather than up front, so it can
   * describe the state the wait actually ended in.
   */
  notice?: () => SplashNotice;
}

/**
 * What a content asks for, which is usually nothing.
 *
 * The default already knows the window's title and can say something true about
 * it, so a content that has an opinion states only the part it disagrees with —
 * a mark of its own, better words, a patience the default has no way to guess.
 * `false` is the way out for a window that should never be covered at all.
 */
export type SplashRequest = Partial<SplashSpec> | false;

/**
 * The contract a window's content opts into.
 *
 * `ready` is the half that matters: a cover with nothing to end it would sit
 * over the window for good, so content that never says when it is ready is
 * never covered — which is right for a page of prose, and was true of every
 * window here before apps arrived.
 */
export interface SplashfulContent {
  splash?: SplashRequest;
  /** Settles when there is something worth looking at. Rejection counts. */
  ready?: Promise<unknown>;
}

/**
 * The cover a window gets when its content asks for nothing in particular.
 *
 * Built from the title, because that is the one thing every window has and the
 * one word the person waiting has already read — the window said "Projects"
 * before it said anything else, so the cover under it should agree.
 *
 * No patience: a wait the desktop knows nothing about has no honest thing to
 * say when it goes on too long, and a notice that guesses is worse than a
 * spinner that admits it is still waiting. Content that knows what its own
 * silence means sets both.
 */
export function defaultSplash(title: string): SplashSpec {
  return { label: `Opening ${title}…`, initial: title };
}

/**
 * What to actually show, given what the content asked for.
 *
 * `undefined` where nothing should be shown — either the content opted out, or
 * it never said when it would be ready and so can never be uncovered.
 */
export function resolveSplash(
  content: SplashfulContent | undefined,
  title: string
): SplashSpec | undefined {
  if (!content?.ready || content.splash === false) return undefined;
  return { ...defaultSplash(title), ...(content.splash ?? {}) };
}

/** How big the mark is drawn. Larger than a menu icon; this one is the subject. */
const MARK_PX = 40;

class Splash extends OSElement {
  private readonly spec: SplashSpec;
  private patience?: ReturnType<typeof setTimeout>;
  /** True once the cover has been taken away, by whichever route. */
  private gone = false;

  constructor(spec: SplashSpec) {
    super("splash", `splash_${uuidv4().replace(/-/g, "")}`);
    this.spec = spec;
    this.className = "splash";

    this.style = () => ({
      "@keyframes splash-spin": {
        from: { transform: "rotate(0deg)" },
        to: { transform: "rotate(360deg)" }
      },
      [this.id]: {
        /*
         * Over the content, not beside it: when the cover goes it should
         * uncover whatever loaded rather than rearrange the window. The
         * z-index is what keeps it there — content mounted after this still
         * comes later in the document.
         */
        position: "absolute",
        inset: "0",
        zIndex: "5",
        background: color.chrome,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        fontFamily: font.ui,
        color: color.ink,

        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "13px",

        "& .splash-mark": {
          width: `${MARK_PX}px`,
          height: `${MARK_PX}px`,
          display: "grid",
          placeItems: "center",
          borderRadius: radius.control,
          overflow: "hidden",
          color: color.inkSoft
        },
        "& .splash-mark img, & .splash-mark svg": {
          width: `${MARK_PX}px`,
          height: `${MARK_PX}px`,
          objectFit: "contain",
          display: "block"
        },
        // What a mark falls back to: a letter in a tinted square is a real
        // mark, where a broken image reads as the desktop being broken.
        "& .splash-initial": {
          width: `${MARK_PX}px`,
          height: `${MARK_PX}px`,
          display: "grid",
          placeItems: "center",
          borderRadius: radius.control,
          background: color.chromeRaised,
          color: color.inkSoft,
          fontFamily: font.mono,
          fontSize: `${Math.round(MARK_PX * 0.45)}px`,
          fontWeight: weight.announce
        },

        "& .splash-spinner": {
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: `2px solid ${color.line}`,
          borderTopColor: color.accent,
          animation: "$splash-spin 760ms linear infinite"
        },
        /*
         * Nothing spins for somebody who asked for less movement. The ring
         * stays as a mark and the line below it carries the meaning, which it
         * has to anyway — a spinner alone never says what is loading.
         */
        "& .splash-spinner.is-still": { animation: "none" },
        "@media (prefers-reduced-motion: reduce)": {
          "& .splash-spinner": { animation: "none" }
        },
        "& .splash-label": {
          margin: "0",
          fontSize: size.bodyTight,
          color: color.inkSoft
        },

        // ------------------------------------------------ the explanation
        // Read rather than watched, so it is set like a paragraph: left, with
        // room around it, instead of centred under a spinner.
        "&.is-notice": {
          alignItems: "stretch",
          justifyContent: "center",
          gap: "11px",
          padding: "28px 30px"
        },
        "& .splash-notice-title": {
          margin: "0",
          fontSize: size.heading,
          fontWeight: weight.announce,
          letterSpacing: "-.01em",
          color: color.ink,
          paddingRight: "34px"
        },
        "& .splash-notice-body": {
          margin: "0",
          fontSize: size.bodyTight,
          lineHeight: 1.6,
          color: color.inkSoft,
          maxWidth: "58ch"
        },
        "& .splash-notice-body code": {
          fontFamily: font.mono,
          fontSize: size.caption,
          padding: "1px 5px",
          borderRadius: "4px",
          background: color.chromeRaised
        },
        "& .splash-actions": { display: "flex", gap: "9px", marginTop: "4px" },
        "& .splash-actions > *": {
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
        "& .splash-actions > *:hover": { color: color.accent },
        "& .splash-actions > *:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "2px"
        },
        // The corner dismiss. Same target size as a window control.
        "& .splash-close": {
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
        "& .splash-close:hover": { background: color.hover, color: color.ink },
        "& .splash-close:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        }
      }
    });
  }

  public async load(element: HTMLElement): Promise<void> {
    // Polite, not assertive: something arriving is not an interruption.
    this.element.setAttribute("role", "status");
    this.element.setAttribute("aria-live", "polite");
    this.element.appendChild(this.waiting());

    await super.load(element);

    if (this.spec.patience) {
      this.patience = setTimeout(() => this.giveUp(), this.spec.patience);
    }
  }

  /** The spinner, the mark, and the line that says what is coming. */
  private waiting(): DocumentFragment {
    const parts = document.createDocumentFragment();

    const mark = this.mark();
    if (mark) parts.appendChild(mark);

    const spinner = document.createElement("span");
    spinner.className = "splash-spinner";
    /*
     * The media query in the stylesheet covers a system asking for reduced
     * motion; this covers the desktop's own Settings toggle, which no media
     * query can see.
     */
    if (prefersReducedMotion()) spinner.classList.add("is-still");
    spinner.setAttribute("aria-hidden", "true");
    parts.appendChild(spinner);

    const label = document.createElement("p");
    label.className = "splash-label";
    label.appendChild(document.createTextNode(this.spec.label));
    parts.appendChild(label);

    return parts;
  }

  /**
   * Whatever the thing being waited for is recognised by.
   *
   * An image URL is somebody else's file and can fail, so it falls back to the
   * initial. A node is the content's own drawing and is trusted as given.
   */
  private mark(): HTMLElement | undefined {
    const { icon, initial } = this.spec;
    if (!icon && !initial) return undefined;

    const box = document.createElement("span");
    box.className = "splash-mark";
    box.setAttribute("aria-hidden", "true");

    if (icon && typeof icon !== "string") {
      box.appendChild(icon);
      return box;
    }

    if (typeof icon === "string") {
      const img = document.createElement("img");
      img.src = icon;
      img.alt = "";
      img.decoding = "async";
      img.addEventListener(
        "error",
        () => {
          img.remove();
          if (initial) box.appendChild(this.letter(initial));
        },
        { once: true }
      );
      box.appendChild(img);
      return box;
    }

    box.appendChild(this.letter(initial!));
    return box;
  }

  private letter(initial: string): HTMLElement {
    const letter = document.createElement("span");
    letter.className = "splash-initial";
    letter.appendChild(document.createTextNode(initial.slice(0, 1)));
    return letter;
  }

  /**
   * Stop promising, start explaining.
   *
   * Only ever when the content gave something to say. Silence with no
   * explanation available is better spent still spinning than on a cover that
   * empties itself.
   */
  private giveUp(): void {
    this.patience = undefined;
    if (this.gone || !this.spec.notice) return;

    this.element.textContent = "";
    this.element.classList.add("is-notice");
    this.element.appendChild(this.explanation(this.spec.notice()));
  }

  private explanation(notice: SplashNotice): DocumentFragment {
    const parts = document.createDocumentFragment();

    if (notice.dismissible) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "splash-close";
      close.setAttribute("aria-label", "Dismiss this notice");
      close.appendChild(document.createTextNode("×"));
      close.addEventListener("click", () => void this.dismiss());
      parts.appendChild(close);
    }

    const title = document.createElement("h2");
    title.className = "splash-notice-title";
    title.appendChild(document.createTextNode(notice.title));
    parts.appendChild(title);

    const body = document.createElement("p");
    body.className = "splash-notice-body";
    notice.body.forEach((part) => {
      if (typeof part === "string") {
        body.appendChild(document.createTextNode(part));
        return;
      }
      const code = document.createElement("code");
      code.appendChild(document.createTextNode(part.code));
      body.appendChild(code);
    });
    parts.appendChild(body);

    if (notice.actions?.length) {
      const actions = document.createElement("div");
      actions.className = "splash-actions";
      notice.actions.forEach((action) =>
        actions.appendChild(this.control(action))
      );
      parts.appendChild(actions);
    }

    return parts;
  }

  private control(action: SplashAction): HTMLElement {
    const press = () => {
      action.onSelect?.();
      if (action.dismisses) void this.dismiss();
    };

    if (action.href) {
      const link = document.createElement("a");
      link.href = action.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.appendChild(document.createTextNode(action.label));
      link.addEventListener("click", press);
      return link;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.appendChild(document.createTextNode(action.label));
    button.addEventListener("click", press);
    return button;
  }

  /**
   * Uncover the window, now that there is something under the cover.
   *
   * Faded rather than cut, so content that arrives quickly does not flash. This
   * fires for the explanation too — a wait that ended after the notice went up
   * has proved the notice wrong.
   */
  public async reveal(): Promise<void> {
    if (this.gone) return;
    this.stopWaiting();
    this.gone = true;

    await motion.fadeOut(this.element, { duration: timing.fast });
    await this.unload();
  }

  /**
   * Take the cover away at once, without waiting for anything.
   *
   * Two callers, both of which want it gone rather than faded: somebody who has
   * pressed past the explanation, and a window closing on content that never
   * arrived.
   */
  public async dismiss(): Promise<void> {
    if (this.gone) return;
    this.stopWaiting();
    this.gone = true;
    await this.unload();
  }

  private stopWaiting(): void {
    if (this.patience === undefined) return;
    clearTimeout(this.patience);
    this.patience = undefined;
  }
}

export default Splash;
