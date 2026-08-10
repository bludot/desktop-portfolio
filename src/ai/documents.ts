import type { Document } from "@thatcatdev/browser-ai";
import experience from "../contents/experience/data";
import type { Repo } from "../utils/github";

/**
 * What this desktop knows about James, as passages worth retrieving.
 *
 * The library takes documents and has no idea what is in them; this is the half
 * that is his. Two rules, both learned by watching retrieval get it wrong:
 *
 *   - A role in one passage averages out into a vector about nothing in
 *     particular. Asked what he did at GoTu, retrieval preferred the short
 *     "senior software engineer" line — tighter on the question, and ignorant
 *     of GoTu. Split per piece of work, each one wins on its own merits.
 *   - Every fragment carries the employer, because a bullet without one is
 *     unattributable: "led the transition from a monolith" is a fact about
 *     somebody's career only if you know whose.
 */

const year = (at: string | Date | undefined): string =>
  at ? String(new Date(at).getFullYear()) : "present";

/**
 * A month and a year, which is as precise as any of this needs to be.
 *
 * Read in UTC, because GitHub's timestamps are UTC and formatting them in local
 * time moves anything pushed just after midnight on the first back into the
 * previous month. The same trap the role dates fell into — see
 * `contents/experience/data`, where it made every job start a month early.
 */
const when = (at: string): string =>
  new Date(at).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });

export function aboutJames(repos: Repo[] = []): Document[] {
  const out: Document[] = [];

  experience.forEach((role, i) => {
    const years = `${year(role.start)}–${year(role.end)}`;
    const at = `${role.position} at ${role.company}`;

    out.push({
      id: `role:${i}`,
      source: at,
      text: `James worked as ${role.position} at ${role.company} in ${role.location} from ${years}. ${role.description[0] ?? ""}`
    });

    role.description.slice(1).forEach((line, j) => {
      out.push({
        id: `role:${i}:${j}`,
        source: at,
        text: `As ${at} (${years}), James ${line.charAt(0).toLowerCase()}${line.slice(1)}`
      });
    });
  });

  out.push({
    id: "about:who",
    source: "About",
    text: "James is a senior software engineer. He works mainly in Go, TypeScript and Node.js, with GraphQL and Kafka; on the data side PostgreSQL, MongoDB, Redis and Elasticsearch; and on the platform side Kubernetes, Docker, Terraform, ArgoCD, Helm, AWS, GCP and Datadog. He is based in Fort Lauderdale, Florida."
  });

  /*
   * The desktop, in three passages rather than one.
   *
   * Asked what this is written in, the single passage that used to be here
   * answered "JavaScript" — because it said "without a framework" and then
   * mentioned PHP and jQuery, and the only language in it belonged to a version
   * from years ago. The same rule as the roles applies to the thing somebody is
   * looking at while they ask: one subject per passage, and the answer to the
   * obvious question stated in the passage that will win it.
   */
  out.push({
    id: "about:desktop",
    source: "About",
    /*
     * It says "operating system" because that is what somebody looking at it
     * calls it — "tell me about this os" found this passage at 0.33, barely
     * over the floor, when the only words for the thing were "desktop" and
     * "portfolio". The page is titled Portfolio OS; the notes may as well know.
     */
    text: "This desktop is James's portfolio, and it is written in TypeScript with no framework: no React, no Vue, no Svelte. It is made to look and work like an operating system — windows you can drag and resize, a taskbar, a start menu and a launcher — and all of that, including the window manager and the theming, is his own code. It is built with Vite, styled with JSS, stores what it needs in IndexedDB through Dexie, and is tested with Vitest."
  });

  out.push({
    id: "about:desktop:ai",
    source: "About",
    text: "The chat window on this desktop runs a small language model on the visitor's own machine, in the browser tab, using transformers.js on WebGPU where there is a GPU and WASM where there is not. Nothing typed into it is sent anywhere. It answers from notes about James held locally, found by embedding the question and comparing it against them. The models and the retrieval live in James's own library, browser-ai."
  });

  out.push({
    id: "about:desktop:history",
    source: "About",
    text: "This desktop revisits an idea James first built years ago in PHP and jQuery. That was the old version; this one is a rebuild with what he has learned since."
  });

  /*
   * Repositories in bundles rather than one passage each: eighty-eight
   * one-line passages would crowd the roles out of retrieval on any query
   * naming a language, and no single repository line is worth a slot of its own.
   */
  const byOwner = new Map<string, Repo[]>();
  repos.forEach((repo) => {
    const owned = byOwner.get(repo.owner) ?? [];
    owned.push(repo);
    byOwner.set(repo.owner, owned);
  });

  byOwner.forEach((owned, owner) => {
    const described = owned.filter((repo) => repo.description).slice(0, 20);
    if (!described.length) return;
    out.push({
      id: `repos:${owner}`,
      source: `${owner} on GitHub`,
      text: `Projects under ${owner}: ${described
        .map(
          (repo) =>
            `${repo.name}${repo.language ? ` (${repo.language})` : ""} — ${repo.description}`
        )
        .join("; ")}.`
    });
  });

  /*
   * What he has touched most recently, and when.
   *
   * "What is his latest project?" is a fair question about a man with ninety
   * repositories, and until this passage existed the notes had no order in
   * them: every project was equally recent, so the model picked one. The dates
   * are the whole point — with them the answer is checkable, and without them
   * "latest" is an invitation to invent.
   */
  const recent = [...repos]
    .filter((repo) => repo.description && repo.pushedAt)
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt));

  if (recent.length) {
    const [newest] = recent;
    /*
     * Short, and leading with the question it answers.
     *
     * The first version of this listed eight repositories with their
     * descriptions, and retrieval never returned it: a long passage embeds as
     * an average of everything in it, and "latest" was one word in two hundred.
     * Four names with their months, and the answer stated outright, scores 0.85
     * on "what is his latest project" where the long one did not place at all.
     */
    out.push({
      id: "repos:recent",
      source: "GitHub",
      text: `What James has worked on most recently, newest first: ${recent
        .slice(0, 4)
        .map((repo) => `${repo.name} in ${when(repo.pushedAt)}`)
        .join(", ")}. His latest project is ${newest.name}${
        newest.language ? ` (${newest.language})` : ""
      } — ${newest.description}.`
    });
  }

  return out;
}

/** One repository, as something the launcher can search by meaning. */
export function fromRepos(repos: Repo[]): Document[] {
  return repos.map((repo) => ({
    id: `${repo.owner}/${repo.name}`,
    source: repo.owner,
    text: [repo.name.replace(/[-_]/g, " "), repo.language, repo.description]
      .filter(Boolean)
      .join(". ")
  }));
}

/**
 * Words too ordinary to be evidence of anything.
 *
 * Only what turns up in a question about him: "what did James do at GoTu"
 * should be nudged by "gotu", not by "james", which is in every passage.
 */
export const COMMON = [
  "what", "when", "where", "which", "does", "done", "james", "your", "about",
  "with", "have", "work", "worked", "tell", "there", "this", "that", "they",
  "them", "from", "into"
];
