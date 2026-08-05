import OSElement from "../../utils/OSElement";
import {
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
import {
  ACCOUNTS,
  loadRepos,
  loadRepoDetail,
  summarise,
  type RepoDetail,
  type AccountSummary,
  type Repo,
  type RepoResult
} from "../../utils/github";

/** Below this the meta line cannot sit beside the name. */
const NARROW_CONTENT_PX = 420;

const ALL = "all";

/**
 * What each account actually is.
 *
 * GitHub gives an organisation no bio and no description, and a repository list
 * on its own does not tell you that one of these is a product and another is
 * fifteen years of everything. Only James can say that, so he did; the numbers
 * underneath are worked out from the repositories.
 */
const ACCOUNT_NOTES: Record<string, string> = {
  "weeb-vip":
    "An anime site, built as a system rather than a repository: the front end, the APIs behind it, the ingest and scheduling that keep it fed, and the infrastructure under all of it.",
  thatcatdev:
    "Where the more considered work goes. Fewer repositories, held to a standard — self-hosted AI tooling, inference servers, developer plumbing.",
  bludot:
    "The personal account, and the oldest by a decade. Everything is in here: experiments, throwaways, and the ones that turned into something."
};

/**
 * Everything on GitHub, across the two organisations and the personal account.
 *
 * The list is fetched in the browser rather than baked in at build time, so it
 * is current without a redeploy — see `utils/github` for how that is kept
 * inside GitHub's anonymous rate limit.
 */
class ProjectsContent extends OSElement {
  private stopObserving?: () => void;
  private body!: HTMLElement;
  private state: "loading" | "ready" | "failed" = "loading";
  private result?: RepoResult;
  private owner: string = ALL;
  /** When set, the window shows this repository instead of the list. */
  private open?: Repo;
  private detail?: RepoDetail;
  private detailState: "loading" | "ready" | "failed" = "loading";

  constructor() {
    super("projectscontent", "projects-content");

    this.body = document.createElement("div");
    this.element.appendChild(this.body);

    this.style = () => ({
      [this.id]: {
        padding: `${space.windowPadY} ${space.windowPadX}`,
        display: "block",
        fontFamily: font.ui,
        color: color.ink,

        "& .projects-bar": {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          paddingBottom: "12px"
        },
        "& .projects-count": {
          margin: "0",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },
        "& .projects-filters": {
          display: "inline-flex",
          padding: "2px",
          gap: "2px",
          borderRadius: radius.pill,
          background: color.chrome,
          boxShadow: `inset 0 0 0 1px ${color.lineSoft}`
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
        "& .projects-filters button:hover": { color: color.ink },
        "& .projects-filters button[aria-pressed='true']": {
          background: color.chromeRaised,
          color: color.ink
        },
        "& .projects-filters button:focus-visible": {
          outline: `2px solid ${color.accent}`,
          outlineOffset: "1px"
        },

        // Side by side when all three are shown, so they read as a set.
        "& .projects-cards": {
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          paddingBottom: "16px"
        },
        "& .projects-cards.is-single": {
          gridTemplateColumns: "1fr"
        },
        "& .projects-card": {
          padding: "11px 13px",
          borderRadius: radius.control,
          background: color.chrome,
          boxShadow: `inset 0 0 0 1px ${color.lineSoft}`
        },
        "& .projects-card-name": {
          margin: "0",
          fontFamily: font.mono,
          fontSize: size.caption,
          letterSpacing: tracking.mono,
          fontWeight: weight.emphasise,
          color: color.accent
        },
        "& .projects-card-note": {
          margin: "6px 0 0",
          fontSize: size.caption,
          lineHeight: 1.5,
          color: color.inkSoft
        },
        "& .projects-card-stats": {
          margin: "8px 0 0",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint,
          fontVariantNumeric: "tabular-nums"
        },

        "& .projects-list": {
          display: "flex",
          flexDirection: "column",
          margin: "0",
          padding: "0",
          listStyle: "none"
        },
        // The whole row is the link: a repository name is a small target, and
        // there is nothing else in the row to click.
        "& .project": {
          // A button, unlike the anchor this used to be, shrinks to its content
          // and centres its text. Without these three every row came out a
          // different width with its description centred under the name.
          width: "100%",
          textAlign: "left",
          font: "inherit",
          // A button also brings its own grey face and border. Cleared before
          // the rule's own border-top, or the other three edges keep the UA one.
          border: "0",
          background: "none",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "6px 16px",
          alignItems: "baseline",
          padding: "11px 8px",
          margin: "0 -8px",
          borderTop: `1px solid ${color.lineSoft}`,
          borderRadius: radius.control,
          color: "inherit",
          textDecoration: "none"
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

        "& .projects-note": {
          margin: "0",
          padding: "18px 0",
          fontSize: size.bodyTight,
          lineHeight: 1.55,
          color: color.inkSoft
        },
        "& .projects-retry": {
          marginTop: "10px",
          border: `1px solid ${color.line}`,
          borderRadius: radius.control,
          padding: "6px 12px",
          background: "transparent",
          color: color.ink,
          font: "inherit",
          fontSize: size.small,
          fontWeight: weight.emphasise,
          cursor: "pointer"
        },
        "& .projects-retry:hover": { background: color.hover },

        // ------------------------------------------------------ detail view
        "& .detail-head": {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          paddingBottom: "14px"
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
          cursor: "pointer"
        },
        "& .detail-back:hover, & .detail-external:hover": { color: color.ink },
        "& .detail-name": {
          margin: "0",
          fontSize: size.display,
          fontWeight: weight.announce,
          letterSpacing: tracking.display
        },
        "& .detail-description": {
          margin: "7px 0 0",
          fontSize: size.body,
          lineHeight: 1.55,
          color: color.inkSoft
        },
        "& .detail-languages": { margin: "14px 0 0" },
        "& .detail-bar": {
          display: "flex",
          height: "6px",
          borderRadius: radius.chip,
          overflow: "hidden",
          background: color.lineSoft
        },
        "& .detail-bar > span": { background: color.accent },
        "& .detail-legend": {
          margin: "7px 0 0",
          fontFamily: font.mono,
          fontSize: size.micro,
          letterSpacing: tracking.mono,
          color: color.inkFaint
        },

        /*
         * The README, which is somebody else's markup. Everything here is
         * deliberately reset rather than inherited: it arrives with GitHub's
         * own classes and expects GitHub's stylesheet, which we do not have.
         */
        "& .detail-readme": {
          marginTop: "18px",
          paddingTop: "16px",
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
        // Wide code must scroll inside itself, never widen the window.
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
        "& .detail-readme img": {
          maxWidth: "100%",
          height: "auto"
        },
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

        "&.is-narrow": {
          padding: "15px 14px",
          // Three columns of prose at phone width is four words a line.
          "& .projects-cards": { gridTemplateColumns: "1fr" },
          "& .project": {
            gridTemplateColumns: "1fr",
            gap: "4px"
          },
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

  private async fetch(force = false) {
    this.state = "loading";
    this.render();
    try {
      this.result = await loadRepos({ force });
      this.state = "ready";
    } catch {
      this.state = "failed";
    }
    this.render();
  }

  private visible(): Repo[] {
    const repos = this.result?.repos ?? [];
    if (this.owner === ALL) return repos;
    // Compared without case: the account is "thatcatdev" but every repo it
    // owns comes back under the login "ThatCatDev".
    const owner = this.owner.toLowerCase();
    return repos.filter((repo) => repo.owner.toLowerCase() === owner);
  }

  /** Open one repository in place of the list. */
  private show(repo: Repo) {
    this.open = repo;
    this.detail = undefined;
    this.detailState = "loading";
    this.render();

    void loadRepoDetail(repo.owner, repo.name)
      .then((detail) => {
        // Ignore a reply for a repository the reader has already left.
        if (this.open !== repo) return;
        this.detail = detail;
        this.detailState = "ready";
      })
      .catch(() => {
        if (this.open === repo) this.detailState = "failed";
      })
      .finally(() => {
        if (this.open === repo) this.render();
      });
  }

  private back() {
    this.open = undefined;
    this.detail = undefined;
    this.render();
  }

  private render() {
    this.body.textContent = "";

    if (this.open) {
      this.renderDetail(this.open);
      return;
    }

    if (this.state === "loading" && !this.result) {
      this.body.appendChild(note("Reading GitHub…"));
      return;
    }

    if (this.state === "failed") {
      const wrapper = document.createElement("div");
      wrapper.appendChild(
        note("GitHub could not be reached, and nothing was stored to fall back on.")
      );
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "projects-retry";
      retry.appendChild(document.createTextNode("Try again"));
      retry.addEventListener("click", () => void this.fetch(true));
      wrapper.appendChild(retry);
      this.body.appendChild(wrapper);
      return;
    }

    this.body.appendChild(this.toolbar());
    this.body.appendChild(this.cards());

    const repos = this.visible();
    if (!repos.length) {
      this.body.appendChild(note("Nothing here."));
      return;
    }

    const list = document.createElement("ul");
    list.className = "projects-list";
    repos.forEach((repo) => list.appendChild(this.row(repo)));
    this.body.appendChild(list);
  }

  /**
   * A note per account, above the list.
   *
   * All three when nothing is filtered, so the shape of the whole thing reads
   * at a glance; just the one when an account is picked, where there is room
   * for it to sit full width.
   */
  private cards(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className =
      this.owner === ALL ? "projects-cards" : "projects-cards is-single";

    const shown = this.owner === ALL ? [...ACCOUNTS] : [this.owner];
    const all = this.result?.repos ?? [];

    shown.forEach((account) => {
      const owned = all.filter(
        (repo) => repo.owner.toLowerCase() === account.toLowerCase()
      );
      wrapper.appendChild(card(account, summarise(owned)));
    });

    return wrapper;
  }

  /** One repository, read through the API rather than framed. */
  private renderDetail(repo: Repo) {
    const header = document.createElement("div");
    header.className = "detail-head";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "detail-back";
    back.appendChild(document.createTextNode("\u2190 All projects"));
    back.addEventListener("click", () => this.back());
    header.appendChild(back);

    const external = document.createElement("a");
    external.className = "detail-external";
    external.href = repo.url;
    external.target = "_blank";
    external.rel = "noopener noreferrer";
    external.appendChild(document.createTextNode("Open on GitHub \u2197"));
    header.appendChild(external);
    this.body.appendChild(header);

    const title = document.createElement("h2");
    title.className = "detail-name";
    title.appendChild(document.createTextNode(repo.name));
    const owner = document.createElement("span");
    owner.className = "project-owner";
    owner.appendChild(document.createTextNode(repo.owner));
    title.appendChild(owner);
    this.body.appendChild(title);

    if (repo.description) {
      const description = document.createElement("p");
      description.className = "detail-description";
      description.appendChild(document.createTextNode(repo.description));
      this.body.appendChild(description);
    }

    const meta = document.createElement("p");
    meta.className = "project-meta";
    meta.appendChild(document.createTextNode(metaLine(repo)));
    this.body.appendChild(meta);

    if (this.detail?.languages.length) {
      this.body.appendChild(languageBar(this.detail.languages));
    }

    const readme = document.createElement("div");
    readme.className = "detail-readme";

    if (this.detailState === "loading") {
      readme.appendChild(note("Reading the repository\u2026"));
    } else if (this.detailState === "failed") {
      readme.appendChild(note("That repository could not be read."));
    } else if (this.detail?.readme) {
      /*
       * GitHub renders the README and sanitises its own output; it is checked
       * again here because this is still somebody else's markup arriving over
       * the network. Relative URLs are resolved as GitHub would resolve them,
       * or a README's images would point at this desktop.
       */
      readme.innerHTML = sanitiseHtml(this.detail.readme, {
        imageBase: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/HEAD`,
        linkBase: `https://github.com/${repo.owner}/${repo.name}/blob/HEAD`
      });
    } else {
      readme.appendChild(note("No README in this one."));
    }

    this.body.appendChild(readme);
  }

  private toolbar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "projects-bar";

    const count = document.createElement("p");
    count.className = "projects-count";
    count.appendChild(document.createTextNode(this.summary()));
    bar.appendChild(count);

    const filters = document.createElement("div");
    filters.className = "projects-filters";
    filters.setAttribute("role", "group");

    [
      { id: ALL, label: "All" },
      ...ACCOUNTS.map((account) => ({ id: account as string, label: account }))
    ].forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(this.owner === option.id));
      button.appendChild(document.createTextNode(option.label));
      button.addEventListener("click", () => {
        this.owner = option.id;
        this.render();
      });
      filters.appendChild(button);
    });

    bar.appendChild(filters);
    return bar;
  }

  private summary(): string {
    const shown = this.visible().length;
    const parts = [`${shown} ${shown === 1 ? "repo" : "repos"}`];

    const hidden = this.result?.forksHidden ?? 0;
    if (hidden && this.owner === ALL) parts.push(`${hidden} forks hidden`);
    if (this.result?.failed.length) {
      parts.push(`${this.result.failed.join(", ")} unavailable`);
    }
    return parts.join(" · ");
  }

  private row(repo: Repo): HTMLElement {
    const item = document.createElement("li");

    // A button, not a link: it opens the repository inside this window.
    // github.com cannot be framed — it sends `frame-ancestors 'none'` — so the
    // window reads the repository through the API and renders it here instead.
    const link = document.createElement("button");
    link.type = "button";
    link.className = "project";
    link.addEventListener("click", () => this.show(repo));

    const name = document.createElement("p");
    name.className = "project-name";
    name.appendChild(document.createTextNode(repo.name));

    const owner = document.createElement("span");
    owner.className = "project-owner";
    owner.appendChild(document.createTextNode(repo.owner));
    name.appendChild(owner);

    if (repo.archived) {
      const archived = document.createElement("span");
      archived.className = "project-archived";
      archived.appendChild(document.createTextNode("Archived"));
      name.appendChild(archived);
    }
    link.appendChild(name);

    const meta = document.createElement("p");
    meta.className = "project-meta";
    meta.appendChild(document.createTextNode(metaLine(repo)));
    link.appendChild(meta);

    if (repo.description) {
      const description = document.createElement("p");
      description.className = "project-description";
      description.appendChild(document.createTextNode(repo.description));
      link.appendChild(description);
    }

    item.appendChild(link);
    return item;
  }
}

/** The language split, as one bar. Proportions say more than byte counts. */
function languageBar(languages: [string, number][]): HTMLElement {
  const total = languages.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;
  const shown = languages.slice(0, 5);

  const wrapper = document.createElement("div");
  wrapper.className = "detail-languages";

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

function card(account: string, summary: AccountSummary): HTMLElement {
  const element = document.createElement("section");
  element.className = "projects-card";

  const name = document.createElement("h2");
  name.className = "projects-card-name";
  name.appendChild(document.createTextNode(account));
  element.appendChild(name);

  const note = ACCOUNT_NOTES[account];
  if (note) {
    const blurb = document.createElement("p");
    blurb.className = "projects-card-note";
    blurb.appendChild(document.createTextNode(note));
    element.appendChild(blurb);
  }

  const stats = document.createElement("p");
  stats.className = "projects-card-stats";
  stats.appendChild(document.createTextNode(statsLine(summary)));
  element.appendChild(stats);

  return element;
}

/** Everything worth saying about a set of repositories, in one line. */
export function statsLine(summary: AccountSummary): string {
  const parts = [`${summary.count} ${summary.count === 1 ? "repo" : "repos"}`];
  if (summary.stars > 0) parts.push(`${summary.stars}★`);
  if (summary.languages.length) parts.push(summary.languages.join(", "));

  if (summary.firstYear && summary.lastYear) {
    parts.push(
      summary.firstYear === summary.lastYear
        ? summary.firstYear
        : `${summary.firstYear}–${summary.lastYear}`
    );
  }
  return parts.join(" · ");
}

/** Language, stars and when it was last touched — only what is there. */
export function metaLine(repo: Repo): string {
  const parts: string[] = [];
  if (repo.language) parts.push(repo.language);
  if (repo.stars > 0) parts.push(`${repo.stars}★`);
  if (repo.pushedAt) parts.push(repo.pushedAt.slice(0, 7).replace("-", "/"));
  return parts.join(" · ");
}

function note(text: string): HTMLElement {
  const element = document.createElement("p");
  element.className = "projects-note";
  element.appendChild(document.createTextNode(text));
  return element;
}

export default ProjectsContent;
