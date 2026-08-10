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

  out.push({
    id: "about:desktop",
    source: "About",
    text: "This desktop is James's portfolio, written without a framework — the windows, taskbar, launcher and theming are all his own. It revisits an idea he first built years ago in PHP and jQuery, rebuilt with what he has learned since."
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
