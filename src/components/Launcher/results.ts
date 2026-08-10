import type { App } from "../../apps/external";
import type { Repo } from "../../utils/github";
import type { OpenWindow } from "../../utils/windowManager";
import { calculate, formatAnswer } from "./math";

/**
 * What the launcher can find, and how it decides what comes first.
 *
 * Kept apart from the component so the part that is easy to get wrong — which
 * of eighty-seven repositories called "anime-something" surfaces when you type
 * three letters — can be checked without a desktop to type into.
 */

export type Group = "Answer" | "Apps" | "Windows" | "Projects" | "Actions" | "Web";

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

/*
 * The answer first, the fallback last.
 *
 * Somebody who typed a sum wants the sum, and it is the one result that is
 * certainly what they meant. A web search is the opposite: it is what to do
 * when nothing here was it, so it sits at the bottom where it can be reached
 * by holding one arrow rather than read past every time.
 */
export const GROUP_ORDER: Group[] = [
  "Answer",
  "Apps",
  "Windows",
  "Projects",
  "Actions",
  "Web"
];

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
  /**
   * Repositories the query is *about*, best first, when that is known.
   *
   * Keys rather than repositories, and a plain map rather than a promise: the
   * ranking here has to stay synchronous and testable, so whatever computed
   * these — a model, a stub, nothing at all — is somebody else's problem.
   */
  related?: Map<string, number>;
  actions: { id: string; name: string; sub?: string; run: () => void }[];
  openApp: (app: App) => void;
  showWindow: (open: OpenWindow) => void;
  openRepo: (repo: Repo) => void;
  copy: (text: string) => void;
  searchWeb: (query: string) => void;
}

/**
 * Where a web search goes.
 *
 * DuckDuckGo rather than Google because it does not need to know who asked, and
 * this is a portfolio rather than somebody's daily browser. One constant to
 * change if that is the wrong call — `https://www.google.com/search?q=` is the
 * whole of the alternative.
 */
export const SEARCH_URL = "https://duckduckgo.com/?q=";
export const SEARCH_NAME = "DuckDuckGo";

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

  const asResult = (repo: Repo, badge?: string): Result => ({
    id: `repo:${repo.owner}/${repo.name}`,
    group: "Projects" as const,
    name: repo.name,
    sub: [repo.owner, repo.language].filter(Boolean).join(" · "),
    badge: badge ?? (repo.homepage ? "live" : undefined),
    run: () => sources.openRepo(repo)
  });

  // Only ever on request: the resting list is about what is open, not about
  // everything that has ever been written.
  const literal = q
    ? ranked(
        sources.repos,
        (repo) => ({ name: repo.name, sub: `${repo.owner} ${repo.description}` }),
        (repo) => asResult(repo)
      ).slice(0, REPO_LIMIT)
    : [];

  /*
   * What the query is about, after what it spells.
   *
   * Never in place of a literal match — somebody typing "weeb" wants weeb-vip,
   * and no similarity score improves on that — and never repeating one. These
   * are the ones with no letters in common with the query at all: "message
   * queue" finding the repository whose description says Kafka. Marked, because
   * a result that matches nothing you typed looks like a bug unless it says why
   * it is there.
   */
  const already = new Set(literal.map((result) => result.id));
  const related = q && sources.related?.size
    ? [...sources.related.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => sources.repos.find((repo) => `${repo.owner}/${repo.name}` === key))
        .filter((repo): repo is Repo => !!repo)
        .map((repo) => asResult(repo, "related"))
        .filter((result) => !already.has(result.id))
    : [];

  const repos = [...literal, ...related].slice(0, REPO_LIMIT);

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

  /*
   * A sum, when the query is one.
   *
   * Parsed rather than evaluated — see `math.ts`. Choosing it copies the
   * answer, which is the only thing anybody wants from a calculator that lives
   * in a search box.
   */
  const value = calculate(q);
  const answer: Result[] =
    value === null
      ? []
      : [
          {
            id: "answer",
            group: "Answer" as const,
            name: formatAnswer(value),
            sub: q.replace(/=+$/, "").trim(),
            badge: "copy",
            run: () => sources.copy(formatAnswer(value))
          }
        ];

  // The last resort, and only ever offered for something worth searching for.
  const web: Result[] =
    q.length > 1
      ? [
          {
            id: "web",
            group: "Web" as const,
            name: `Search for “${q}”`,
            sub: SEARCH_NAME,
            badge: "opens a tab",
            run: () => sources.searchWeb(q)
          }
        ]
      : [];

  const byGroup: Record<Group, Result[]> = {
    Answer: answer,
    Apps: apps,
    Windows: windows,
    Projects: repos,
    Actions: actions,
    Web: web
  };

  return GROUP_ORDER.flatMap((group) => byGroup[group]);
}
