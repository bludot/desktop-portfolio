import type { App } from "../../apps/external";
import type { Repo } from "../../utils/github";
import type { OpenWindow } from "../../utils/windowManager";

/**
 * What the launcher can find, and how it decides what comes first.
 *
 * Kept apart from the component so the part that is easy to get wrong — which
 * of eighty-seven repositories called "anime-something" surfaces when you type
 * three letters — can be checked without a desktop to type into.
 */

export type Group = "Apps" | "Windows" | "Projects" | "Actions";

export interface Result {
  id: string;
  group: Group;
  name: string;
  /** The line under the name: a host, an owner, a language. */
  sub?: string;
  /** Right-aligned word, for a state worth seeing before choosing. */
  badge?: string;
  /** The app this result stands for, when it is one — the icon comes from it. */
  app?: App;
  run: () => void;
}

/** Groups appear in this order, whatever the scores inside them. */
export const GROUP_ORDER: Group[] = ["Apps", "Windows", "Projects", "Actions"];

/**
 * How well a candidate answers a query, or -1 for not at all.
 *
 * Four tiers rather than a fuzzy distance: a portfolio has tens of things in it,
 * not thousands, and a score somebody can predict beats one that is marginally
 * better at ranking. Matching the start of the name beats matching the start of
 * a word inside it, which beats appearing anywhere, which beats matching only
 * the subtitle.
 */
export function score(query: string, name: string, sub = ""): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const n = name.toLowerCase();
  if (n.startsWith(q)) return 4;
  // A word boundary inside the name: "anime-api" answers "api".
  if (new RegExp(`(^|[^a-z0-9])${escapeRegExp(q)}`).test(n)) return 3;
  if (n.includes(q)) return 2;
  if (sub.toLowerCase().includes(q)) return 1;
  return -1;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface Sources {
  apps: App[];
  windows: OpenWindow[];
  repos: Repo[];
  actions: { id: string; name: string; sub?: string; run: () => void }[];
  openApp: (app: App) => void;
  showWindow: (open: OpenWindow) => void;
  openRepo: (repo: Repo) => void;
}

/** How many repositories a query may contribute, before it is a wall of them. */
const REPO_LIMIT = 6;

/**
 * Everything matching the query, best first within each group.
 *
 * With no query at all this is the resting state: the apps, whatever windows
 * are open, and the actions — but no repositories, because eighty-seven of them
 * unasked-for is a list rather than an answer.
 */
export function search(query: string, sources: Sources): Result[] {
  const q = query.trim();

  const ranked = <T>(
    items: T[],
    of: (item: T) => { name: string; sub?: string },
    build: (item: T) => Result
  ): Result[] =>
    items
      .map((item) => {
        const { name, sub } = of(item);
        return { item, rank: score(q, name, sub) };
      })
      .filter((entry) => entry.rank >= 0)
      .sort((a, b) => b.rank - a.rank)
      .map((entry) => build(entry.item));

  const apps = ranked(
    sources.apps,
    (app) => ({ name: app.name, sub: app.host }),
    (app) => ({
      id: `app:${app.id}`,
      group: "Apps" as const,
      name: app.name,
      sub: app.host,
      app,
      run: () => sources.openApp(app)
    })
  );

  const windows = ranked(
    sources.windows,
    (open) => ({ name: open.title }),
    (open) => ({
      id: `window:${open.title}:${open.minimized}`,
      group: "Windows" as const,
      name: open.title,
      badge: open.minimized ? "minimised" : undefined,
      run: () => sources.showWindow(open)
    })
  );

  // Only ever on request: the resting list is about what is open, not about
  // everything that has ever been written.
  const repos = q
    ? ranked(
        sources.repos,
        (repo) => ({ name: repo.name, sub: `${repo.owner} ${repo.description}` }),
        (repo) => ({
          id: `repo:${repo.owner}/${repo.name}`,
          group: "Projects" as const,
          name: repo.name,
          sub: [repo.owner, repo.language].filter(Boolean).join(" · "),
          badge: repo.homepage ? "live" : undefined,
          run: () => sources.openRepo(repo)
        })
      ).slice(0, REPO_LIMIT)
    : [];

  const actions = ranked(
    sources.actions,
    (action) => ({ name: action.name, sub: action.sub }),
    (action) => ({
      id: `action:${action.id}`,
      group: "Actions" as const,
      name: action.name,
      sub: action.sub,
      run: action.run
    })
  );

  const byGroup: Record<Group, Result[]> = {
    Apps: apps,
    Windows: windows,
    Projects: repos,
    Actions: actions
  };

  return GROUP_ORDER.flatMap((group) => byGroup[group]);
}
