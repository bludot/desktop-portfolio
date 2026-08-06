import OSElement from "../../utils/OSElement";
import {
  code as codeColour,
  color,
  font,
  radius,
  size,
  space,
  tracking,
  weight
} from "../../theme";
import { observeWidth } from "../../utils/utils";
import sanitiseHtml from "../../utils/sanitiseHtml";
import { motion } from "../../utils/motion";
import highlight from "../../utils/highlight";
import {
  ACCOUNTS,
  classify,
  countInside,
  fetchFile,
  listDirectory,
  loadRepoDetail,
  loadRepos,
  loadTree,
  rawUrl,
  summarise,
  type Repo,
  type RepoDetail,
  type RepoResult,
  type TreeEntry
} from "../../utils/github";
import {
  brief,
  byteSize,
  crumbs,
  dropRepeatedTitle,
  metaLine,
  numberLines,
  parentOf,
  railLine,
  statsLine
} from "./view";

/** Below this the rail cannot sit beside the list. */
const NARROW_CONTENT_PX = 560;

const ALL = "all";

/**
 * What each account actually is.
 *
 * GitHub gives an organisation no bio and no description, and a repository list
 * on its own does not tell you that one of these is a product and another is
 * fifteen years of everything. Only James can say that, so he did; the numbers
 * beside them are worked out from the repositories.
 */
const ACCOUNT_NOTES: Record<string, string> = {
  "weeb-vip":
    "An anime site, built as a system rather than a repository: the front end, the APIs behind it, the ingest and scheduling that keep it fed, and the infrastructure under all of it.",
  thatcatdev:
    "Where the more considered work goes. Fewer repositories, held to a standard — self-hosted AI tooling, inference servers, developer plumbing.",
  bludot:
    "The personal account, and the oldest by a decade. Everything is in here: experiments, throwaways, and the ones that turned into something."
};

type Phase = "idle" | "loading" | "ready" | "failed";

/**
 * Everything on GitHub, across the two organisations and the personal account.
 *
 * Repositories open inside this window rather than on github.com, which sends
 * `frame-ancestors 'none'` and cannot be framed at all. The API gives more than
 * an embed would anyway: a rendered README, the language split, and the whole
 * file tree in a single request.
 */
class ProjectsContent extends OSElement {
  private stopObserving?: () => void;
  private body!: HTMLElement;

  private phase: Phase = "loading";
  private result?: RepoResult;
  private owner: string = ALL;
  /** Primary language, or ALL. Reset when it no longer exists in scope. */
  private language: string = ALL;
  /** Only what has somewhere to visit. */
  private liveOnly = false;
  /** Archived work is still work, so it is hidden on request rather than by default. */
  private hideArchived = false;

  private open?: Repo;
  private tab: "readme" | "files" = "readme";
  private detail?: RepoDetail;
  private detailPhase: Phase = "idle";

  private tree?: TreeEntry[];
  private treePhase: Phase = "idle";
  private dir = "";
  private file?: TreeEntry;
  private fileText?: string;
  private filePhase: Phase = "idle";

  constructor() {
    super("projectscontent", "projects-content");

    this.body = document.createElement("div");
    this.element.appendChild(this.body);

    this.style = () => ({
      [this.id]: {
        display: "block",
        fontFamily: font.ui,
        color: color.ink,
        fontSize: size.bodyTight,

        // ------------------------------------------------------- the list
        // Rail beside the list, not stacked above it: this window is wide and
        // short, and the accounts used to spend a quarter of its height.
        "& .projects-layout": {
          display: "grid",
          gridTemplateColumns: "196px 1fr",
          minHeight: "100%"
        },
        "& .projects-rail": {
          padding: `${space.windowPadY} 12px ${space.windowPadY} ${space.windowPadX}`,
          borderRight: `1px solid ${color.lineSoft}`,
          display: "flex",
          flexDirection: "column",
          gap: "2px"
        },
        "& .rail-item": {
          width: "100%",
          textAlign: "left",
          font: "inherit",
          border: "0",
          background: "none",
          padding: "8px 10px",
          borderRadius: radius.control,
          cursor: "pointer",
          display: "block"
        },
        "& .rail-item:hover": { background: color.hover },
        "& .rail-item[aria-pressed='true']": { background: color.chromeRaised },
        "& .rail-item:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },
        "& .rail-name": {
          display: "block",
          fontFamily: font.mono,
          fontSize: size.caption,
          fontWeight: weight.emphasise,
          letterSpacing: tracking.mono,
          color: color.ink
        },
        "& .rail-item[aria-pressed='true'] .rail-name": { color: color.accent },
        "& .rail-count": {
          display: "block",
          marginTop: "3px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },
        "& .rail-note": {
          margin: "7px 0 0",
          fontSize: size.caption,
          lineHeight: 1.45,
          color: color.inkSoft
        },

        "& .projects-pane": {
          padding: `${space.windowPadY} ${space.windowPadX} ${space.windowPadY} 16px`,
          minWidth: 0
        },
        "& .projects-count": {
          margin: "0 0 10px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },
        // Shown only when the rail cannot fit.
        "& .projects-filters": { display: "none" },
        "& .narrow-note": { display: "none" },

        /*
         * Wrapping, and always on: unlike the account chips this row has no
         * equivalent in the rail, so it is the only way to reach these.
         */
        "& .projects-refine": {
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "4px",
          margin: "0 0 10px"
        },
        "& .projects-refine button": {
          display: "inline-flex",
          alignItems: "baseline",
          gap: "5px",
          border: `1px solid ${color.lineSoft}`,
          borderRadius: radius.pill,
          padding: "3px 10px",
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.caption,
          fontWeight: weight.emphasise,
          cursor: "pointer"
        },
        "& .projects-refine button:hover": { background: color.hover },
        "& .projects-refine button[aria-pressed='true']": {
          background: color.chromeRaised,
          borderColor: color.line,
          color: color.ink
        },
        // The one chip that is about the work being reachable rather than about
        // what it is, so it carries the accent the "Live" badge does.
        "& .projects-refine .refine-live[aria-pressed='true']": {
          borderColor: color.accent,
          color: color.accent
        },
        "& .refine-count": {
          fontFamily: font.mono,
          fontSize: "9.5px",
          color: color.inkFaint
        },
        "& .projects-refine button[aria-pressed='true'] .refine-count": {
          color: "inherit"
        },
        "& .refine-divider": {
          width: "1px",
          alignSelf: "stretch",
          margin: "1px 5px",
          background: color.lineSoft
        },

        "& .projects-list": {
          display: "flex",
          flexDirection: "column",
          margin: "0",
          padding: "0",
          listStyle: "none"
        },
        "& .project": {
          // A button, unlike the anchor this used to be, shrinks to its content
          // and centres its text, and brings its own grey face and border.
          width: "100%",
          textAlign: "left",
          font: "inherit",
          border: "0",
          background: "none",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "5px 16px",
          alignItems: "baseline",
          padding: "10px 8px",
          margin: "0 -8px",
          borderTop: `1px solid ${color.lineSoft}`,
          borderRadius: radius.control,
          color: "inherit",
          cursor: "pointer"
        },
        "& .projects-list li:first-child .project": { borderTop: "0" },
        "& .project:hover": { background: color.hover },
        "& .project:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "-2px"
        },
        "& .project-name": {
          margin: "0",
          fontSize: size.bodyTight,
          fontWeight: weight.announce,
          letterSpacing: tracking.heading
        },
        "& .project-owner": {
          marginLeft: "7px",
          fontFamily: font.mono,
          fontSize: size.micro,
          fontWeight: weight.read,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },
        "& .project-archived": {
          marginLeft: "7px",
          padding: "1px 5px",
          borderRadius: "3px",
          border: `1px solid ${color.line}`,
          fontFamily: font.mono,
          fontSize: "9.5px",
          textTransform: "uppercase",
          letterSpacing: ".1em",
          color: color.inkFaint
        },
        /*
         * "There is something to visit here", on the row.
         *
         * A marker rather than a link: the whole row is already one button, and
         * an anchor inside a button is neither valid nor clickable in any
         * predictable way. The link itself is in the detail head, one press
         * further in, where there is room to say where it goes.
         */
        "& .project-live": {
          marginLeft: "7px",
          padding: "1px 5px",
          borderRadius: "3px",
          border: `1px solid ${color.accent}`,
          fontFamily: font.mono,
          fontSize: "9.5px",
          textTransform: "uppercase",
          letterSpacing: ".1em",
          color: color.accent
        },
        "& .project-description": {
          gridColumn: "1 / -1",
          margin: "0",
          fontSize: size.caption,
          lineHeight: 1.5,
          color: color.inkSoft
        },
        "& .project-meta": {
          margin: "0",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums"
        },

        // ----------------------------------------------------- the detail
        /*
         * Sticky, because a 17KB README scrolls "back" off the top and leaves
         * no way out of the repository but the scrollbar.
         */
        "& .detail-head": {
          position: "sticky",
          top: "0",
          zIndex: "2",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: `12px ${space.windowPadX}`,
          background: color.glass,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${color.lineSoft}`
        },
        "& .detail-back, & .detail-external": {
          border: "0",
          padding: "0",
          background: "none",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          textDecoration: "none",
          cursor: "pointer",
          whiteSpace: "nowrap"
        },
        "& .detail-back:hover, & .detail-external:hover": { color: color.ink },
        "& .detail-links": {
          display: "inline-flex",
          alignItems: "center",
          gap: "14px"
        },
        // The one link that leads somewhere other than more source gets the
        // accent; the pair are otherwise the same weight.
        "& .detail-visit": { color: color.accent },
        "& .detail-visit:hover": { color: color.accentPressed },
        "& .detail-tabs": {
          display: "inline-flex",
          padding: "2px",
          gap: "2px",
          borderRadius: radius.pill,
          background: color.chrome
        },
        "& .detail-tabs button": {
          border: "0",
          borderRadius: "6px",
          padding: "3px 11px",
          background: "transparent",
          color: color.inkSoft,
          font: "inherit",
          fontSize: size.caption,
          fontWeight: weight.emphasise,
          cursor: "pointer"
        },
        "& .detail-tabs button[aria-pressed='true']": {
          background: color.chromeRaised,
          color: color.ink
        },
        /*
         * Full width up to a ceiling, centred past it.
         *
         * Two different things want two different widths. Code and file lists
         * want every pixel there is — a maximised window showing a 74ch column
         * of source with the rest of the screen empty is absurd. Prose does not:
         * past about seventy characters a line the eye loses its place, so the
         * README keeps a measure of its own inside this column.
         */
        "& .detail-body": {
          maxWidth: "1100px",
          margin: "0 auto",
          padding: `14px ${space.windowPadX} ${space.windowPadY}`
        },
        "& .detail-name": {
          margin: "0",
          fontSize: size.display,
          fontWeight: weight.announce,
          letterSpacing: tracking.display
        },
        "& .detail-description": {
          margin: "6px 0 0",
          fontSize: size.body,
          lineHeight: 1.55,
          color: color.inkSoft
        },

        "& .detail-brief": {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: "8px",
          margin: "14px 0 0"
        },
        "& .brief-cell": {
          padding: "9px 11px",
          borderRadius: radius.control,
          background: color.chrome
        },
        "& .brief-value": {
          display: "block",
          fontSize: size.bodyTight,
          fontWeight: weight.announce,
          letterSpacing: tracking.heading
        },
        "& .brief-label": {
          display: "block",
          marginTop: "2px",
          fontFamily: font.mono,
          fontSize: "9.5px",
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: color.inkFaint
        },

        "& .detail-bar": {
          display: "flex",
          height: "5px",
          borderRadius: radius.chip,
          overflow: "hidden",
          background: color.lineSoft,
          margin: "12px 0 0"
        },
        "& .detail-bar > span": { background: color.accent },
        "& .detail-legend": {
          margin: "6px 0 0",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },

        /*
         * The README, which is somebody else's markup. Everything is reset
         * rather than inherited: it arrives with GitHub's own classes and
         * expects GitHub's stylesheet, which we do not have.
         */
        "& .detail-readme": {
          // Prose keeps its own measure inside the column. Full-bleed it ran to
          // about 95 characters a line, which is why a good README read as a
          // wall.
          maxWidth: "70ch",
          /*
           * Centred, not left-aligned.
           *
           * A measure narrower than the window has to sit somewhere, and against
           * the left edge it leaves a gutter half the width of the pane on the
           * right — which reads as a mistake rather than as a margin. It is also
           * the frame anything the README centres itself is centred against, so
           * a left-hugging column puts a `<p align="center">` title off to one
           * side of the window. Auto margins collapse to nothing once the pane
           * is narrower than the measure, so this costs a small window nothing.
           */
          margin: "16px auto 0",
          paddingTop: "14px",
          borderTop: `1px solid ${color.lineSoft}`,
          fontSize: size.bodyTight,
          lineHeight: 1.62,
          color: color.inkSoft,
          overflowWrap: "anywhere"
        },
        "& .detail-readme h1, & .detail-readme h2, & .detail-readme h3": {
          margin: "20px 0 8px",
          fontSize: size.heading,
          fontWeight: weight.announce,
          letterSpacing: tracking.heading,
          color: color.ink,
          lineHeight: 1.3
        },
        "& .detail-readme h1": { fontSize: "17px" },
        "& .detail-readme p": { margin: "0 0 10px" },
        "& .detail-readme ul, & .detail-readme ol": {
          margin: "0 0 10px",
          paddingLeft: "18px"
        },
        "& .detail-readme li": { margin: "0 0 4px" },
        "& .detail-readme a": {
          color: color.ink,
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          textDecorationColor: color.inkFaint
        },
        "& .detail-readme code": {
          fontFamily: font.mono,
          fontSize: size.caption,
          padding: "1px 4px",
          borderRadius: "3px",
          background: color.chrome
        },
        "& .detail-readme pre": {
          margin: "0 0 12px",
          padding: "11px 13px",
          borderRadius: radius.control,
          background: color.chrome,
          overflowX: "auto"
        },
        "& .detail-readme pre code": {
          padding: "0",
          background: "none",
          whiteSpace: "pre"
        },
        "& .detail-readme img": { maxWidth: "100%", height: "auto" },
        "& .detail-readme blockquote": {
          margin: "0 0 12px",
          padding: "2px 0 2px 12px",
          borderLeft: `2px solid ${color.line}`,
          color: color.inkFaint
        },
        "& .detail-readme table": {
          display: "block",
          width: "100%",
          overflowX: "auto",
          borderCollapse: "collapse",
          margin: "0 0 12px"
        },
        "& .detail-readme th, & .detail-readme td": {
          padding: "6px 10px",
          border: `1px solid ${color.lineSoft}`,
          textAlign: "left"
        },
        "& .detail-readme hr": {
          border: "0",
          borderTop: `1px solid ${color.lineSoft}`,
          margin: "16px 0"
        },

        // ------------------------------------------------------ the files
        "& .files": {
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: `1px solid ${color.lineSoft}`
        },
        "& .crumbs": {
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "5px",
          margin: "0 0 8px",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },
        "& .crumb": {
          border: "0",
          padding: "0",
          background: "none",
          font: "inherit",
          color: color.inkSoft,
          cursor: "pointer"
        },
        "& .crumb:hover": { color: color.ink },
        "& .crumb[aria-disabled='true']": { color: color.ink, cursor: "default" },

        "& .file-list": { margin: "0", padding: "0", listStyle: "none" },
        "& .file-row": {
          width: "100%",
          textAlign: "left",
          border: "0",
          background: "none",
          display: "grid",
          gridTemplateColumns: "14px 1fr auto",
          gap: "10px",
          alignItems: "center",
          padding: "6px 7px",
          margin: "0 -7px",
          borderRadius: radius.chip,
          fontFamily: font.mono,
          fontSize: size.caption,
          color: color.inkSoft,
          cursor: "pointer"
        },
        "& .file-row:hover": { background: color.hover },
        "& .file-row:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "-2px"
        },
        "& .file-row.is-dir > .file-name": { color: color.ink },
        "& .file-glyph": { color: color.inkFaint, fontSize: size.micro },
        "& .file-name": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },
        "& .file-size": {
          fontSize: "9.5px",
          color: color.inkFaint,
          fontVariantNumeric: "tabular-nums"
        },

        "& .file-head": {
          display: "flex",
          alignItems: "baseline",
          gap: "9px",
          margin: "0 0 8px"
        },
        "& .file-head b": {
          fontFamily: font.mono,
          fontSize: size.caption,
          fontWeight: weight.emphasise
        },
        "& .file-head span": {
          fontFamily: font.mono,
          fontSize: size.micro,
          color: color.inkFaint
        },
        "& .file-head a": {
          marginLeft: "auto",
          fontSize: size.caption,
          color: color.inkSoft,
          textDecoration: "none"
        },
        "& .file-head a:hover": { color: color.ink },

        /*
         * Line numbers and nothing else. A highlighter is a dependency and one
         * more place for somebody else's markup to reach innerHTML; mono and a
         * gutter carry it.
         */
        "& .file-code": {
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "0 12px",
          padding: "10px 12px",
          borderRadius: radius.control,
          background: color.chrome,
          fontFamily: font.mono,
          fontSize: size.caption,
          lineHeight: 1.7,
          overflowX: "auto"
        },
        "& .file-numbers": {
          margin: "0",
          textAlign: "right",
          whiteSpace: "pre",
          color: color.inkFaint,
          userSelect: "none"
        },
        "& .file-source": {
          margin: "0",
          whiteSpace: "pre",
          color: color.inkSoft
        },
        "& .tok-comment": { color: codeColour.comment, fontStyle: "italic" },
        "& .tok-string": { color: codeColour.string },
        "& .tok-keyword": { color: codeColour.keyword },
        "& .tok-number": { color: codeColour.number },
        "& .tok-name": { color: codeColour.name },
        "& .tok-type": { color: codeColour.type },
        "& .tok-meta": { color: codeColour.meta },
        "& .file-image": {
          maxWidth: "100%",
          borderRadius: radius.control,
          background: color.chrome
        },

        // ----------------------------------------------------- the states
        "& .projects-note": {
          margin: "0",
          padding: "16px 0",
          fontSize: size.bodyTight,
          lineHeight: 1.55,
          color: color.inkSoft,
          maxWidth: "52ch"
        },
        "& .projects-action": {
          marginTop: "10px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.control,
          padding: "6px 12px",
          background: "transparent",
          color: color.ink,
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          textDecoration: "none",
          display: "inline-block",
          cursor: "pointer"
        },
        "& .projects-action:hover": { background: color.hover },

        // ---------------------------------------------------------- narrow
        "&.is-narrow": {
          // No room for a rail beside the list; the accounts become chips and
          // the note becomes one line — the same information, stacked.
          "& .projects-layout": { gridTemplateColumns: "1fr" },
          "& .projects-rail": { display: "none" },
          "& .projects-pane": { padding: "15px 14px" },
          "& .projects-filters": {
            display: "inline-flex",
            padding: "2px",
            gap: "2px",
            borderRadius: radius.pill,
            background: color.chrome,
            marginBottom: "10px",
            flexWrap: "wrap"
          },
          "& .projects-filters button": {
            border: "0",
            borderRadius: "6px",
            padding: "4px 10px",
            background: "transparent",
            color: color.inkSoft,
            font: "inherit",
            fontSize: size.caption,
            fontWeight: weight.emphasise,
            cursor: "pointer"
          },
          "& .projects-filters button[aria-pressed='true']": {
            background: color.chromeRaised,
            color: color.ink
          },
          "& .narrow-note": {
            display: "block",
            margin: "0 0 10px",
            fontSize: size.caption,
            lineHeight: 1.45,
            color: color.inkSoft
          },
          "& .detail-head, & .detail-body": {
            paddingLeft: "14px",
            paddingRight: "14px"
          },
          "& .project": { gridTemplateColumns: "1fr", gap: "4px" },
          "& .project-meta": { gridColumn: "1 / -1" }
        }
      }
    });

    this.render();
  }

  async load(element: HTMLElement) {
    await super.load(element);
    this.stopObserving = observeWidth(this.element, NARROW_CONTENT_PX);
    void this.fetch();
  }

  async unload() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    await super.unload();
  }

  // ------------------------------------------------------------- fetching

  private async fetch(force = false) {
    this.phase = "loading";
    this.render();
    try {
      this.result = await loadRepos({ force });
      this.phase = "ready";
    } catch {
      this.phase = "failed";
    }
    this.render();
  }

  /**
   * The account's repositories, before the refinements are applied.
   *
   * Kept apart from `visible` so the language chips can be built from what the
   * account actually contains rather than from what is left after choosing one
   * — otherwise picking Go would leave Go as the only language on offer, with
   * no way back to the others.
   */
  private inScope(): Repo[] {
    const repos = this.result?.repos ?? [];
    if (this.owner === ALL) return repos;
    // Compared without case: the account is "thatcatdev" but every repo it
    // owns comes back under the login "ThatCatDev".
    const owner = this.owner.toLowerCase();
    return repos.filter((repo) => repo.owner.toLowerCase() === owner);
  }

  private visible(): Repo[] {
    return this.inScope().filter((repo) => {
      if (this.liveOnly && !repo.homepage) return false;
      if (this.hideArchived && repo.archived) return false;
      if (this.language !== ALL && repo.language !== this.language) return false;
      return true;
    });
  }

  /**
   * The languages in scope, most used first.
   *
   * Counted rather than listed, because the count is what makes the chip worth
   * pressing: "Go 21" says where the work is in a way that "Go" does not.
   */
  private languages(): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    this.inScope().forEach((repo) => {
      if (!repo.language) return;
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      // Ties fall back to alphabetical rather than to insertion order, so the
      // row does not reshuffle itself between renders.
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  private ownedBy(account: string): Repo[] {
    const owner = account.toLowerCase();
    return (this.result?.repos ?? []).filter(
      (repo) => repo.owner.toLowerCase() === owner
    );
  }

  /**
   * Redraw, and let the new view arrive rather than appear.
   *
   * Uses the desktop's motion layer, so reduced motion and a hidden tab are
   * already handled and this needs no branch of its own.
   */
  private navigate(from: "right" | "left" = "right") {
    this.render();
    void motion.viewIn(this.body, from);
  }

  /** Open one repository in place of the list. */
  private show(repo: Repo) {
    this.open = repo;
    this.tab = "readme";
    this.detail = undefined;
    this.detailPhase = "loading";
    this.tree = undefined;
    this.treePhase = "idle";
    this.dir = "";
    this.file = undefined;
    this.fileText = undefined;
    this.filePhase = "idle";
    this.navigate("right");

    void loadRepoDetail(repo.owner, repo.name)
      .then((detail) => {
        // Ignore a reply for a repository the reader has already left.
        if (this.open !== repo) return;
        this.detail = detail;
        this.detailPhase = "ready";
      })
      .catch(() => {
        if (this.open === repo) this.detailPhase = "failed";
      })
      .finally(() => {
        if (this.open === repo) this.render();
      });
  }

  private back() {
    this.open = undefined;
    this.detail = undefined;
    this.tree = undefined;
    this.file = undefined;
    this.navigate("left");
  }

  private openTab(tab: "readme" | "files") {
    // Readme sits left of Files, so moving between them follows the tabs.
    const from = tab === "files" ? "right" : "left";
    this.tab = tab;
    this.navigate(from);
    if (tab === "files" && this.treePhase === "idle") void this.loadFiles();
  }

  private async loadFiles() {
    const repo = this.open;
    if (!repo) return;
    this.treePhase = "loading";
    this.render();

    try {
      const { entries } = await loadTree(repo.owner, repo.name);
      if (this.open !== repo) return;
      this.tree = entries;
      this.treePhase = "ready";
    } catch {
      if (this.open === repo) this.treePhase = "failed";
    }
    if (this.open === repo) this.render();
  }

  private openEntry(entry: TreeEntry) {
    if (entry.type === "tree") {
      this.dir = entry.path;
      this.file = undefined;
      this.navigate("right");
      return;
    }

    this.file = entry;
    this.fileText = undefined;
    // Only text is fetched; everything else is decided from name and size.
    this.filePhase = classify(entry) === "text" ? "loading" : "ready";
    this.navigate("right");

    if (this.filePhase !== "loading" || !this.open) return;

    const repo = this.open;
    void fetchFile(repo.owner, repo.name, entry.path)
      .then((text) => {
        if (this.file !== entry) return;
        this.fileText = text;
        this.filePhase = "ready";
      })
      .catch(() => {
        if (this.file === entry) this.filePhase = "failed";
      })
      .finally(() => {
        if (this.file === entry) this.render();
      });
  }

  private goToDir(dir: string) {
    // Always a step back out — up the tree, or out of a file.
    this.dir = dir;
    this.file = undefined;
    this.navigate("left");
  }

  // ------------------------------------------------------------ rendering

  private render() {
    this.body.textContent = "";

    if (this.open) {
      this.renderDetail(this.open);
      return;
    }

    if (this.phase === "loading" && !this.result) {
      this.body.appendChild(note("Reading GitHub…"));
      return;
    }

    if (this.phase === "failed") {
      this.body.appendChild(
        note("GitHub could not be reached, and nothing was stored to fall back on.")
      );
      this.body.appendChild(action("Try again", () => void this.fetch(true)));
      return;
    }

    this.renderList();
  }

  private renderList() {
    const layout = document.createElement("div");
    layout.className = "projects-layout";
    layout.appendChild(this.rail());

    const pane = document.createElement("div");
    pane.className = "projects-pane";

    // Both are rendered; the stylesheet shows whichever fits.
    pane.appendChild(this.filters());
    pane.appendChild(this.refine());
    const blurb = ACCOUNT_NOTES[this.owner];
    if (blurb) {
      const narrowNote = document.createElement("p");
      narrowNote.className = "narrow-note";
      narrowNote.appendChild(document.createTextNode(blurb));
      pane.appendChild(narrowNote);
    }

    const count = document.createElement("p");
    count.className = "projects-count";
    count.appendChild(document.createTextNode(this.summary()));
    pane.appendChild(count);

    const repos = this.visible();
    if (!repos.length) {
      pane.appendChild(note("Nothing here."));
    } else {
      const list = document.createElement("ul");
      list.className = "projects-list";
      repos.forEach((repo) => list.appendChild(this.row(repo)));
      pane.appendChild(list);
    }

    layout.appendChild(pane);
    this.body.appendChild(layout);
  }

  private rail(): HTMLElement {
    const rail = document.createElement("div");
    rail.className = "projects-rail";

    const entries = [
      { id: ALL, label: "All", repos: this.result?.repos ?? [] },
      ...ACCOUNTS.map((account) => ({
        id: account as string,
        label: account as string,
        repos: this.ownedBy(account)
      }))
    ];

    entries.forEach((entry) => {
      const selected = this.owner === entry.id;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "rail-item";
      button.setAttribute("aria-pressed", String(selected));

      const name = document.createElement("span");
      name.className = "rail-name";
      name.appendChild(document.createTextNode(entry.label));
      button.appendChild(name);

      const count = document.createElement("span");
      count.className = "rail-count";
      count.appendChild(
        document.createTextNode(
          entry.id === ALL
            ? `${entry.repos.length} repos`
            : railLine(summarise(entry.repos))
        )
      );
      button.appendChild(count);

      // The note appears under whichever account is selected, so it is read
      // where it applies rather than three of them at once.
      const blurb = ACCOUNT_NOTES[entry.id];
      if (selected && blurb) {
        const text = document.createElement("p");
        text.className = "rail-note";
        text.appendChild(document.createTextNode(blurb));
        button.appendChild(text);
      }

      button.addEventListener("click", () => this.chooseOwner(entry.id));
      rail.appendChild(button);
    });

    return rail;
  }

  private filters(): HTMLElement {
    const filters = document.createElement("div");
    filters.className = "projects-filters";
    filters.setAttribute("role", "group");

    [
      { id: ALL, label: "All" },
      ...ACCOUNTS.map((account) => ({
        id: account as string,
        label: account as string
      }))
    ].forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(this.owner === option.id));
      button.appendChild(document.createTextNode(option.label));
      button.addEventListener("click", () => this.chooseOwner(option.id));
      filters.appendChild(button);
    });

    return filters;
  }

  /**
   * The refinements: what it is written in, whether it is running, and whether
   * it is still alive.
   *
   * Beneath the account chips rather than beside them, because these narrow
   * whichever account is chosen rather than choosing one. Every chip carries
   * its count, so a chip that would empty the list says so before it is pressed
   * — and a count of zero is shown rather than hidden, since a language
   * disappearing as you filter is how a list starts lying about what is in it.
   */
  /**
   * Move to another account, keeping the refinements that still mean something.
   *
   * A language chosen under one account usually does not exist under the next,
   * and leaving it set would show an empty list with no visible reason for it.
   */
  private chooseOwner(owner: string) {
    this.owner = owner;
    if (
      this.language !== ALL &&
      !this.languages().some((language) => language.name === this.language)
    ) {
      this.language = ALL;
    }
    this.render();
  }

  private refine(): HTMLElement {
    const row = document.createElement("div");
    row.className = "projects-refine";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Filter projects");

    const scope = this.inScope();

    const chip = (
      label: string,
      count: number,
      pressed: boolean,
      onPress: () => void,
      extraClass?: string
    ) => {
      const button = document.createElement("button");
      button.type = "button";
      if (extraClass) button.className = extraClass;
      button.setAttribute("aria-pressed", String(pressed));
      button.appendChild(document.createTextNode(label));

      const tally = document.createElement("span");
      tally.className = "refine-count";
      tally.appendChild(document.createTextNode(String(count)));
      button.appendChild(tally);

      button.addEventListener("click", () => {
        onPress();
        this.render();
      });
      row.appendChild(button);
      return button;
    };

    const live = scope.filter((repo) => repo.homepage).length;
    if (live) {
      chip("Live", live, this.liveOnly, () => {
        this.liveOnly = !this.liveOnly;
      }, "refine-live");
    }

    const archived = scope.filter((repo) => repo.archived).length;
    if (archived) {
      chip("Hide archived", archived, this.hideArchived, () => {
        this.hideArchived = !this.hideArchived;
      });
    }

    const languages = this.languages();
    if (languages.length > 1) {
      const divider = document.createElement("span");
      divider.className = "refine-divider";
      divider.setAttribute("aria-hidden", "true");
      row.appendChild(divider);

      chip("Any language", scope.length, this.language === ALL, () => {
        this.language = ALL;
      });
      languages.forEach((language) => {
        chip(language.name, language.count, this.language === language.name, () => {
          // A second press on the chosen one clears it, so the row does not
          // need a separate way out of a choice it just made.
          this.language = this.language === language.name ? ALL : language.name;
        });
      });
    }

    return row;
  }

  private summary(): string {
    if (this.owner !== ALL) return statsLine(summarise(this.visible()));

    const shown = this.visible().length;
    const parts = [`${shown} ${shown === 1 ? "repo" : "repos"}`];
    const hidden = this.result?.forksHidden ?? 0;
    if (hidden) parts.push(`${hidden} forks hidden`);
    if (this.result?.failed.length) {
      parts.push(`${this.result.failed.join(", ")} unavailable`);
    }
    return parts.join(" · ");
  }

  private row(repo: Repo): HTMLElement {
    const item = document.createElement("li");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "project";
    button.addEventListener("click", () => this.show(repo));

    const name = document.createElement("p");
    name.className = "project-name";
    name.appendChild(document.createTextNode(repo.name));

    // Redundant once the rail has narrowed things to a single account.
    if (this.owner === ALL) {
      const owner = document.createElement("span");
      owner.className = "project-owner";
      owner.appendChild(document.createTextNode(repo.owner));
      name.appendChild(owner);
    }

    if (repo.homepage) {
      const live = document.createElement("span");
      live.className = "project-live";
      live.appendChild(document.createTextNode("Live"));
      name.appendChild(live);
    }

    if (repo.archived) {
      const archived = document.createElement("span");
      archived.className = "project-archived";
      archived.appendChild(document.createTextNode("Archived"));
      name.appendChild(archived);
    }
    button.appendChild(name);

    const meta = document.createElement("p");
    meta.className = "project-meta";
    meta.appendChild(document.createTextNode(metaLine(repo)));
    button.appendChild(meta);

    if (repo.description) {
      const description = document.createElement("p");
      description.className = "project-description";
      description.appendChild(document.createTextNode(repo.description));
      button.appendChild(description);
    }

    item.appendChild(button);
    return item;
  }

  // --------------------------------------------------------------- detail

  private renderDetail(repo: Repo) {
    this.body.appendChild(this.detailHead(repo));

    const detail = document.createElement("div");
    detail.className = "detail-body";

    const title = document.createElement("h2");
    title.className = "detail-name";
    title.appendChild(document.createTextNode(repo.name));
    const owner = document.createElement("span");
    owner.className = "project-owner";
    owner.appendChild(document.createTextNode(repo.owner));
    title.appendChild(owner);
    detail.appendChild(title);

    if (repo.description) {
      const description = document.createElement("p");
      description.className = "detail-description";
      description.appendChild(document.createTextNode(repo.description));
      detail.appendChild(description);
    }

    const cells = brief(repo, this.detail?.languages ?? []);
    if (cells.length) {
      const strip = document.createElement("div");
      strip.className = "detail-brief";
      cells.forEach((cell) => {
        const box = document.createElement("div");
        box.className = "brief-cell";

        const value = document.createElement("b");
        value.className = "brief-value";
        value.appendChild(document.createTextNode(cell.value));
        box.appendChild(value);

        const label = document.createElement("span");
        label.className = "brief-label";
        label.appendChild(document.createTextNode(cell.label));
        box.appendChild(label);

        strip.appendChild(box);
      });
      detail.appendChild(strip);
    }

    if (this.detail?.languages.length) {
      detail.appendChild(languageBar(this.detail.languages));
    }

    detail.appendChild(
      this.tab === "files" ? this.filesPane(repo) : this.readmePane(repo)
    );
    this.body.appendChild(detail);
  }

  private detailHead(repo: Repo): HTMLElement {
    const head = document.createElement("div");
    head.className = "detail-head";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "detail-back";
    back.appendChild(document.createTextNode("← All projects"));
    back.addEventListener("click", () => this.back());
    head.appendChild(back);

    const tabs = document.createElement("div");
    tabs.className = "detail-tabs";
    tabs.setAttribute("role", "group");
    ([
      { id: "readme", label: "Readme" },
      { id: "files", label: "Files" }
    ] as const).forEach((tab) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(this.tab === tab.id));
      button.appendChild(document.createTextNode(tab.label));
      button.addEventListener("click", () => this.openTab(tab.id));
      tabs.appendChild(button);
    });
    head.appendChild(tabs);

    const links = document.createElement("div");
    links.className = "detail-links";

    /*
     * The running thing first, when there is one.
     *
     * Somebody reading about a project would rather see it than read its
     * source, and most of these have no site at all — so the link is only ever
     * there when it leads somewhere, and it leads the pair when it is.
     */
    if (repo.homepage) {
      const visit = document.createElement("a");
      visit.className = "detail-external detail-visit";
      visit.href = repo.homepage;
      visit.target = "_blank";
      visit.rel = "noopener noreferrer";
      visit.appendChild(document.createTextNode("Visit site ↗"));
      links.appendChild(visit);
    }

    const external = document.createElement("a");
    external.className = "detail-external";
    external.href = repo.url;
    external.target = "_blank";
    external.rel = "noopener noreferrer";
    external.appendChild(
      document.createTextNode(repo.homepage ? "GitHub ↗" : "Open on GitHub ↗")
    );
    links.appendChild(external);
    head.appendChild(links);

    return head;
  }

  private readmePane(repo: Repo): HTMLElement {
    const readme = document.createElement("div");
    readme.className = "detail-readme";

    if (this.detailPhase === "loading") {
      readme.appendChild(note("Reading the repository…"));
      return readme;
    }
    if (this.detailPhase === "failed") {
      readme.appendChild(note("That repository could not be read."));
      return readme;
    }
    if (!this.detail?.readme) {
      readme.appendChild(
        note("Nothing written down for this one. The code is on GitHub.")
      );
      return readme;
    }

    /*
     * GitHub renders the README and sanitises its own output; it is checked
     * again here because this is still somebody else's markup arriving over
     * the network. Relative URLs are resolved as GitHub would resolve them, or
     * a README's images would point at this desktop.
     */
    readme.innerHTML = dropRepeatedTitle(
      sanitiseHtml(this.detail.readme, {
        imageBase: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/HEAD`,
        linkBase: `https://github.com/${repo.owner}/${repo.name}/blob/HEAD`
      }),
      repo.name
    );
    return readme;
  }

  // ---------------------------------------------------------------- files

  private filesPane(repo: Repo): HTMLElement {
    const files = document.createElement("div");
    files.className = "files";

    if (this.treePhase === "loading" || this.treePhase === "idle") {
      files.appendChild(note("Reading the file list…"));
      return files;
    }
    if (this.treePhase === "failed" || !this.tree) {
      files.appendChild(note("The file list could not be read."));
      return files;
    }

    files.appendChild(this.crumbTrail(repo));
    files.appendChild(
      this.file ? this.filePane(repo) : this.directory(this.tree)
    );
    return files;
  }

  private crumbTrail(repo: Repo): HTMLElement {
    const trail = document.createElement("p");
    trail.className = "crumbs";

    const step = (label: string, dir: string, last: boolean) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "crumb";
      button.appendChild(document.createTextNode(label));
      if (last) {
        button.setAttribute("aria-disabled", "true");
      } else {
        button.addEventListener("click", () => this.goToDir(dir));
      }
      trail.appendChild(button);
    };

    const parts = crumbs(this.dir);
    step(repo.name, "", !parts.length && !this.file);

    parts.forEach((part, i) => {
      trail.appendChild(document.createTextNode("/"));
      const path = parts.slice(0, i + 1).join("/");
      step(part, path, i === parts.length - 1 && !this.file);
    });

    if (this.file) {
      trail.appendChild(document.createTextNode("/"));
      step(this.file.name, this.dir, true);
    }

    return trail;
  }

  private directory(tree: TreeEntry[]): HTMLElement {
    const list = document.createElement("ul");
    list.className = "file-list";

    if (this.dir) {
      list.appendChild(
        this.fileRow("↑", "..", "", () => this.goToDir(parentOf(this.dir)), true)
      );
    }

    const entries = listDirectory(tree, this.dir);
    if (!entries.length) {
      const empty = document.createElement("li");
      empty.appendChild(note("This folder is empty."));
      list.appendChild(empty);
      return list;
    }

    entries.forEach((entry) => {
      const isDir = entry.type === "tree";
      const inside = isDir ? countInside(tree, entry.path) : 0;
      list.appendChild(
        this.fileRow(
          isDir ? "▸" : "·",
          entry.name,
          isDir
            ? `${inside} ${inside === 1 ? "file" : "files"}`
            : byteSize(entry.size),
          () => this.openEntry(entry),
          isDir
        )
      );
    });

    return list;
  }

  private fileRow(
    glyph: string,
    name: string,
    detail: string,
    onOpen: () => void,
    isDir: boolean
  ): HTMLElement {
    const item = document.createElement("li");

    const button = document.createElement("button");
    button.type = "button";
    button.className = `file-row${isDir ? " is-dir" : ""}`;
    button.addEventListener("click", onOpen);

    const mark = document.createElement("span");
    mark.className = "file-glyph";
    mark.appendChild(document.createTextNode(glyph));
    button.appendChild(mark);

    const label = document.createElement("span");
    label.className = "file-name";
    label.appendChild(document.createTextNode(name));
    button.appendChild(label);

    const meta = document.createElement("span");
    meta.className = "file-size";
    meta.appendChild(document.createTextNode(detail));
    button.appendChild(meta);

    item.appendChild(button);
    return item;
  }

  private filePane(repo: Repo): HTMLElement {
    const file = this.file!;
    const wrapper = document.createElement("div");

    const head = document.createElement("div");
    head.className = "file-head";

    const name = document.createElement("b");
    name.appendChild(document.createTextNode(file.name));
    head.appendChild(name);

    const meta = document.createElement("span");
    meta.appendChild(document.createTextNode(byteSize(file.size)));
    head.appendChild(meta);

    const raw = document.createElement("a");
    raw.href = rawUrl(repo.owner, repo.name, file.path);
    raw.target = "_blank";
    raw.rel = "noopener noreferrer";
    raw.appendChild(document.createTextNode("Raw ↗"));
    head.appendChild(raw);
    wrapper.appendChild(head);

    const kind = classify(file);

    if (kind === "image") {
      const image = document.createElement("img");
      image.className = "file-image";
      image.src = rawUrl(repo.owner, repo.name, file.path);
      image.alt = file.name;
      wrapper.appendChild(image);
      return wrapper;
    }
    if (kind === "binary") {
      wrapper.appendChild(
        note(`A ${byteSize(file.size)} binary. Nothing to show here.`)
      );
      return wrapper;
    }
    if (kind === "generated") {
      wrapper.appendChild(
        note(
          `${file.name} is written by a tool and ${byteSize(file.size)} long. Opening it would tell you nothing.`
        )
      );
      return wrapper;
    }
    if (kind === "too-large") {
      wrapper.appendChild(
        note(`${byteSize(file.size)} is too much to open in a window this size.`)
      );
      return wrapper;
    }

    if (this.filePhase === "loading") {
      wrapper.appendChild(note("Reading…"));
      return wrapper;
    }
    if (this.filePhase === "failed" || this.fileText === undefined) {
      wrapper.appendChild(note("That file could not be read."));
      return wrapper;
    }

    const { numbers, source } = numberLines(this.fileText);
    const code = document.createElement("div");
    code.className = "file-code";

    const gutter = document.createElement("pre");
    gutter.className = "file-numbers";
    gutter.setAttribute("aria-hidden", "true");
    gutter.appendChild(document.createTextNode(numbers));
    code.appendChild(gutter);

    const body = document.createElement("pre");
    body.className = "file-source";
    body.appendChild(highlight(source, file.name));
    code.appendChild(body);

    wrapper.appendChild(code);
    return wrapper;
  }
}

// -------------------------------------------------------------- builders

/** The language split, as one bar. Proportions say more than byte counts. */
function languageBar(languages: [string, number][]): HTMLElement {
  const total = languages.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;
  const shown = languages.slice(0, 5);

  const wrapper = document.createElement("div");

  const bar = document.createElement("div");
  bar.className = "detail-bar";
  shown.forEach(([, bytes], i) => {
    const part = document.createElement("span");
    part.style.width = `${(bytes / total) * 100}%`;
    part.style.opacity = String(1 - i * 0.17);
    bar.appendChild(part);
  });
  wrapper.appendChild(bar);

  const legend = document.createElement("p");
  legend.className = "detail-legend";
  legend.appendChild(
    document.createTextNode(
      shown
        .map(([name, bytes]) => `${name} ${Math.round((bytes / total) * 100)}%`)
        .join("  ·  ")
    )
  );
  wrapper.appendChild(legend);

  return wrapper;
}

function note(text: string): HTMLElement {
  const element = document.createElement("p");
  element.className = "projects-note";
  element.appendChild(document.createTextNode(text));
  return element;
}

function action(label: string, onClick: () => void): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "projects-action";
  button.appendChild(document.createTextNode(label));
  button.addEventListener("click", onClick);
  return button;
}

export default ProjectsContent;
export { metaLine, statsLine } from "./view";
