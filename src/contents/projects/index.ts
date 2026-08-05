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
import { ACCOUNTS, loadRepos, type Repo, type RepoResult } from "../../utils/github";

/** Below this the meta line cannot sit beside the name. */
const NARROW_CONTENT_PX = 420;

const ALL = "all";

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

        "&.is-narrow": {
          padding: "15px 14px",
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

  private render() {
    this.body.textContent = "";

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

    const link = document.createElement("a");
    link.className = "project";
    link.href = repo.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

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
