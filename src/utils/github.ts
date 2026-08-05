import { readCache, writeCache } from "../Store";

/**
 * The repositories behind the Projects window.
 *
 * Read straight from GitHub's public API in the browser rather than baked in at
 * build time, so the list is current without a redeploy every time something is
 * pushed. The cost of that is GitHub's anonymous rate limit — 60 requests an
 * hour per address — which is why the answer is cached: a cold load spends
 * three requests, and every visit for the next few hours spends none.
 */

/** Two organisations and a personal account. The endpoint serves both. */
export const ACCOUNTS = ["thatcatdev", "weeb-vip", "bludot"] as const;

export type Account = (typeof ACCOUNTS)[number];

export interface Repo {
  id: number;
  name: string;
  owner: string;
  description: string;
  language: string;
  stars: number;
  url: string;
  pushedAt: string;
  archived: boolean;
}

export interface RepoIndex {
  repos: Repo[];
  /** Forks are left out; this is how many, so the omission is not silent. */
  forksHidden: number;
  /** Accounts that could not be read this time. */
  failed: string[];
}

export interface RepoResult extends RepoIndex {
  fetchedAt: number;
  /** True when this came from the cache rather than the network. */
  cached: boolean;
}

const CACHE_KEY = "github:repos";
/** Long enough that browsing the site never re-fetches; short enough to be current. */
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const endpoint = (account: string) =>
  `https://api.github.com/users/${account}/repos?per_page=100&sort=pushed`;

/** Only the fields the window shows, so the cache stays small. */
function toRepo(raw: Record<string, unknown>): Repo {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    owner: String((raw.owner as { login?: string })?.login ?? ""),
    description: String(raw.description ?? ""),
    language: String(raw.language ?? ""),
    stars: Number(raw.stargazers_count ?? 0),
    url: String(raw.html_url ?? ""),
    pushedAt: String(raw.pushed_at ?? ""),
    archived: Boolean(raw.archived)
  };
}

async function fetchAccount(account: string): Promise<Record<string, unknown>[]> {
  const response = await fetch(endpoint(account), {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${account}`);
  }
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

/**
 * Every repository across the accounts, newest push first.
 *
 * One account failing does not sink the rest: whatever came back is returned,
 * with the failures named so the window can say so. Only a total failure
 * throws.
 */
export async function fetchRepos(): Promise<RepoIndex> {
  const results = await Promise.allSettled(ACCOUNTS.map(fetchAccount));

  const failed: string[] = [];
  const raw: Record<string, unknown>[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      raw.push(...result.value);
    } else {
      failed.push(ACCOUNTS[i]);
    }
  });

  if (failed.length === ACCOUNTS.length) {
    throw new Error("Could not reach GitHub");
  }

  // Forks are someone else's work with his name on the copy, so they are left
  // out of a portfolio — but counted, so the list is not quietly shorter than
  // the account is.
  const forks = raw.filter((r) => Boolean(r.fork));
  const repos = raw
    .filter((r) => !r.fork)
    .map(toRepo)
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

  return { repos, forksHidden: forks.length, failed };
}

/**
 * The list, from the cache when it is recent enough and from GitHub otherwise.
 *
 * A failed fetch falls back to whatever is cached, however old — a list from
 * this morning is far better than an error page — and only reports failure
 * when there is nothing to fall back to.
 */
export async function loadRepos(
  options: { force?: boolean; now?: number } = {}
): Promise<RepoResult> {
  const now = options.now ?? Date.now();
  const cached = await readCache<RepoIndex>(CACHE_KEY, now);

  if (!options.force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached.value, fetchedAt: cached.fetchedAt, cached: true };
  }

  try {
    const fresh = await fetchRepos();
    await writeCache(CACHE_KEY, fresh, now);
    return { ...fresh, fetchedAt: now, cached: false };
  } catch (error) {
    if (cached) {
      return { ...cached.value, fetchedAt: cached.fetchedAt, cached: true };
    }
    throw error;
  }
}
