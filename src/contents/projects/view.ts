import type { AccountSummary, Repo, TreeEntry } from "../../utils/github";

/**
 * The pure half of the Projects window: everything that turns data into the
 * words on screen, with no DOM involved. Kept apart so the arithmetic can be
 * checked directly rather than through a rendered window.
 */

/** Language, stars and when it was last touched — only what is there. */
export function metaLine(repo: Repo): string {
  const parts: string[] = [];
  if (repo.language) parts.push(repo.language);
  if (repo.stars > 0) parts.push(`${repo.stars}★`);
  if (repo.pushedAt) parts.push(repo.pushedAt.slice(0, 7).replace("-", "/"));
  return parts.join(" · ");
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

/** A short line for the rail: how many, over what span. */
export function railLine(summary: AccountSummary): string {
  const span =
    summary.firstYear && summary.lastYear
      ? summary.firstYear === summary.lastYear
        ? summary.firstYear
        : `${summary.firstYear}–${summary.lastYear}`
      : "";
  return [String(summary.count), span].filter(Boolean).join(" · ");
}

/** GitHub reports size in kilobytes; say it the way a person would. */
export function fileSize(kilobytes: number): string {
  if (kilobytes >= 1024) return `${Math.round(kilobytes / 1024)} MB`;
  return `${Math.max(kilobytes, 1)} KB`;
}

/** The same, for a file's byte count out of the tree. */
export function byteSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${bytes} B`;
}

/**
 * How long a repository has been going, in the roughest useful unit.
 *
 * "5 months" says more about a project than a star count of one, and unlike
 * stars every repository has a creation date.
 */
export function ageLabel(createdAt: string, now: Date = new Date()): string {
  if (!createdAt) return "";
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "";

  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  if (months < 1) return "this month";
  if (months < 24) return `${months} ${months === 1 ? "month" : "months"}`;

  const years = Math.floor(months / 12);
  return `${years} years`;
}

export interface BriefCell {
  value: string;
  label: string;
}

/**
 * The four figures above a repository, each derived from a field every
 * repository has — so this is never empty, which a topics-and-licence panel
 * would be for almost all of them.
 */
export function brief(
  repo: Repo,
  languages: [string, number][],
  now: Date = new Date()
): BriefCell[] {
  const cells: BriefCell[] = [];

  const total = languages.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (languages.length && total > 0) {
    const [name, bytes] = languages[0];
    cells.push({
      value: name,
      label: `${Math.round((bytes / total) * 100)}% of source`
    });
  } else if (repo.language) {
    cells.push({ value: repo.language, label: "language" });
  }

  const age = ageLabel(repo.createdAt, now);
  if (age) cells.push({ value: age, label: "since first commit" });

  if (repo.pushedAt) {
    cells.push({
      value: repo.pushedAt.slice(0, 7).replace("-", "/"),
      label: "last push"
    });
  }

  if (repo.size > 0) {
    cells.push({ value: fileSize(repo.size), label: "checked out" });
  }

  return cells;
}

/** Where a directory sits, as the segments of its path. */
export function crumbs(dir: string): string[] {
  return dir ? dir.split("/") : [];
}

/** The directory one level up from here. */
export function parentOf(dir: string): string {
  const cut = dir.lastIndexOf("/");
  return cut === -1 ? "" : dir.slice(0, cut);
}

/**
 * Strip the README's own title when it just repeats the repository.
 *
 * Every one of these opens with its own H1 directly under the title the window
 * already shows, which reads as a stutter. Only the first heading is
 * considered, and only when it is recognisably the same name.
 */
export function dropRepeatedTitle(html: string, repoName: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const first = doc.body.querySelector("h1");
  if (!first) return html;

  /*
   * Nothing may be rendered before it, or the heading is not the opener.
   *
   * Checked over a range rather than by walking siblings: GitHub wraps the
   * whole README in a div and an article, so the heading is never a child of
   * the body and a sibling walk decided every title was buried and kept it.
   */
  const before = doc.createRange();
  before.setStart(doc.body, 0);
  before.setEndBefore(first);
  if (before.toString().trim()) return html;

  const simplify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();

  const heading = simplify(first.textContent ?? "");
  const name = simplify(repoName);
  // "Tanrenai (鍛錬AI)" against "tanrenai": the heading may carry more, but it
  // has to start with the repository's name to count as the same title.
  if (!heading || !name || !heading.startsWith(name)) return html;

  first.remove();
  return doc.body.innerHTML;
}

/** Splits a file into its lines, for numbering. */
export function numberLines(text: string): { numbers: string; source: string } {
  const lines = text.replace(/\n$/, "").split("\n");
  return {
    numbers: lines.map((_, i) => String(i + 1)).join("\n"),
    source: lines.join("\n")
  };
}

export type { TreeEntry };
