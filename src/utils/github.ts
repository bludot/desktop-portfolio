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
  /**
   * Where the thing actually runs, when there is somewhere.
   *
   * GitHub's own "Website" field, which is the one place a repository says
   * this. Empty for most of them — plenty of work has no site to visit — so
   * everything downstream treats it as optional rather than expected.
   */
  homepage: string;
  pushedAt: string;
  createdAt: string;
  /** Kilobytes, as GitHub reports it. */
  size: number;
  archived: boolean;
}

/**
 * What a pile of repositories adds up to.
 *
 * Derived from the list already in hand rather than asked for separately: the
 * accounts are two organisations and a personal account, and GitHub gives an
 * organisation no bio, no description, nothing — so the only thing worth
 * saying about them has to be worked out from the work itself.
 */
export interface AccountSummary {
  count: number;
  stars: number;
  /** The three languages it reaches for most, by repository count. */
  languages: string[];
  /** The years it has been active between, or empty if that is unknowable. */
  firstYear: string;
  lastYear: string;
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

/*
 * Versioned, because the cache holds trimmed repositories rather than GitHub's
 * own reply. A cached entry written before a field existed cannot grow one, so
 * a reader mid-visit would go hours without it; a new key retires those entries
 * the moment the shape changes.
 */
export const CACHE_KEY = "github:repos:v2";
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
    homepage: String(raw.homepage ?? ""),
    pushedAt: String(raw.pushed_at ?? ""),
    createdAt: String(raw.created_at ?? ""),
    size: Number(raw.size ?? 0),
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
/**
 * The read that is already happening, if one is.
 *
 * Three things on this desktop want the repositories now — the Projects
 * window, the launcher's search and the chat window's notes — and each used to
 * ask for its own. Three consumers arriving together is three sets of requests
 * for the same answer, against an API that allows sixty an hour to an address
 * that is not signed in. Sharing the promise makes it one.
 */
let reading: Promise<RepoResult> | undefined;

/**
 * When the last attempt failed, and how long to leave it alone afterwards.
 *
 * Rate limiting arrives as a 403 on every request, and without this each
 * consumer answers it by trying again — which is how a desktop that has run out
 * of quota spends the rest of the hour asking for more of it. A minute is long
 * enough to stop the drumming and short enough that a passing failure is not
 * remembered as an outage.
 */
let failedAt = 0;
const BACK_OFF_MS = 60_000;

export async function loadRepos(
  options: { force?: boolean; now?: number } = {}
): Promise<RepoResult> {
  const now = options.now ?? Date.now();
  const cached = await readCache<RepoIndex>(CACHE_KEY, now);

  if (!options.force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached.value, fetchedAt: cached.fetchedAt, cached: true };
  }

  /*
   * Nothing to fall back on and no point asking yet: whatever is cached is
   * better than a request that is going to be refused, and a stale answer is
   * better than none.
   */
  if (!options.force && failedAt && now - failedAt < BACK_OFF_MS) {
    if (cached) return { ...cached.value, fetchedAt: cached.fetchedAt, cached: true };
    throw new Error("GitHub was refusing requests a moment ago");
  }

  // A request already in flight is the answer everybody is waiting for.
  if (!options.force && reading) return reading;

  reading = (async () => {
    try {
      const fresh = await fetchRepos();
      failedAt = 0;
      await writeCache(CACHE_KEY, fresh, now);
      return { ...fresh, fetchedAt: now, cached: false };
    } catch (error) {
      failedAt = now;
      if (cached) {
        return { ...cached.value, fetchedAt: cached.fetchedAt, cached: true };
      }
      throw error;
    } finally {
      reading = undefined;
    }
  })();

  return reading;
}

/** Forget that anything went wrong. For tests, and for "Try again". */
export function forgetGithubFailure(): void {
  failedAt = 0;
  reading = undefined;
}

const year = (iso: string) => (iso ? iso.slice(0, 4) : "");

/** The shape of a set of repositories, for the note above the list. */
export function summarise(repos: Repo[]): AccountSummary {
  const byLanguage = new Map<string, number>();
  repos.forEach((repo) => {
    if (!repo.language) return;
    byLanguage.set(repo.language, (byLanguage.get(repo.language) ?? 0) + 1);
  });

  const languages = [...byLanguage.entries()]
    // Count first, then alphabetically, so the order never wobbles between
    // renders when two languages are level.
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([language]) => language);

  // Cached entries written before createdAt existed fall back to the push date,
  // which is late but never wrong in the other direction.
  const starts = repos
    .map((repo) => year(repo.createdAt) || year(repo.pushedAt))
    .filter(Boolean);
  const ends = repos.map((repo) => year(repo.pushedAt)).filter(Boolean);

  return {
    count: repos.length,
    stars: repos.reduce((total, repo) => total + repo.stars, 0),
    languages,
    firstYear: starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : "",
    lastYear: ends.length ? ends.reduce((a, b) => (a > b ? a : b)) : ""
  };
}

// --------------------------------------------------------------- readme

const README_TTL_MS = 24 * 60 * 60 * 1000;

export interface RepoDetail {
  /** Rendered by GitHub, sanitised by us. Empty when there is no README. */
  readme: string;
  /** Bytes of source per language, largest first. */
  languages: [string, number][];
}

/**
 * The detail behind one repository.
 *
 * GitHub renders the README to HTML for us, which is the whole reason this
 * window can show a repository rather than link to one: github.com sends
 * `X-Frame-Options: deny` and `frame-ancestors 'none'`, so an iframe of a repo
 * page is a blank box, and no amount of trying changes that.
 *
 * Both calls are optional — a repository with no README is normal, and the
 * language breakdown is a nicety — so a failure of either returns empty rather
 * than sinking the view.
 */
export async function fetchRepoDetail(
  owner: string,
  name: string
): Promise<RepoDetail> {
  const [readme, languages] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${name}/readme`, {
      headers: { Accept: "application/vnd.github.html" }
    })
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => ""),
    fetch(`https://api.github.com/repos/${owner}/${name}/languages`, {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
  ]);

  return {
    readme: typeof readme === "string" ? readme : "",
    languages: Object.entries(languages as Record<string, number>).sort(
      (a, b) => b[1] - a[1]
    )
  };
}

export async function loadRepoDetail(
  owner: string,
  name: string,
  options: { now?: number } = {}
): Promise<RepoDetail> {
  const now = options.now ?? Date.now();
  const key = `github:detail:${owner}/${name}`;

  const cached = await readCache<RepoDetail>(key, now);
  if (cached && now - cached.fetchedAt < README_TTL_MS) return cached.value;

  try {
    const detail = await fetchRepoDetail(owner, name);
    await writeCache(key, detail, now);
    return detail;
  } catch (error) {
    if (cached) return cached.value;
    throw error;
  }
}

// ----------------------------------------------------------------- files

/** One entry in a repository's tree. */
export interface TreeEntry {
  /** Full path from the repository root. */
  path: string;
  /** Just the last segment. */
  name: string;
  type: "blob" | "tree";
  size: number;
}

const TREE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Every path in a repository, in one request.
 *
 * The recursive tree endpoint returns the whole thing — paths, types and sizes
 * — so browsing costs one call and then nothing. Reading a file costs nothing
 * either: raw.githubusercontent.com is a different host and does not count
 * against the API's sixty an hour.
 *
 * GitHub truncates the response for enormous repositories. None of these come
 * close, but the flag is passed through rather than ignored so the window can
 * say so if it ever happens.
 */
export async function fetchTree(
  owner: string,
  name: string
): Promise<{ entries: TreeEntry[]; truncated: boolean }> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${name}/git/trees/HEAD?recursive=1`,
    { headers: { Accept: "application/vnd.github+json" } }
  );
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

  const body = await response.json();
  const raw: Record<string, unknown>[] = Array.isArray(body?.tree) ? body.tree : [];

  const entries = raw
    .filter((e) => e.type === "blob" || e.type === "tree")
    .map((e) => {
      const path = String(e.path ?? "");
      return {
        path,
        name: path.slice(path.lastIndexOf("/") + 1),
        type: e.type as "blob" | "tree",
        size: Number(e.size ?? 0)
      };
    });

  return { entries, truncated: Boolean(body?.truncated) };
}

export async function loadTree(
  owner: string,
  name: string,
  options: { now?: number } = {}
): Promise<{ entries: TreeEntry[]; truncated: boolean }> {
  const now = options.now ?? Date.now();
  const key = `github:tree:${owner}/${name}`;

  const cached = await readCache<{ entries: TreeEntry[]; truncated: boolean }>(key, now);
  if (cached && now - cached.fetchedAt < TREE_TTL_MS) return cached.value;

  try {
    const tree = await fetchTree(owner, name);
    await writeCache(key, tree, now);
    return tree;
  } catch (error) {
    if (cached) return cached.value;
    throw error;
  }
}

/**
 * What sits directly inside a directory — not the whole subtree.
 *
 * The tree arrives flat, so a level is everything prefixed by the directory
 * with no further slash after it. Directories first, then files, each
 * alphabetically, which is the order every file browser uses.
 */
export function listDirectory(entries: TreeEntry[], dir: string): TreeEntry[] {
  const prefix = dir ? `${dir}/` : "";

  return entries
    .filter((entry) => {
      if (!entry.path.startsWith(prefix)) return false;
      const rest = entry.path.slice(prefix.length);
      return rest.length > 0 && !rest.includes("/");
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

/** How many entries a directory holds, for the count beside a folder. */
export function countInside(entries: TreeEntry[], dir: string): number {
  const prefix = `${dir}/`;
  return entries.filter(
    (entry) => entry.path.startsWith(prefix) && entry.type === "blob"
  ).length;
}

export const rawUrl = (owner: string, name: string, path: string) =>
  `https://raw.githubusercontent.com/${owner}/${name}/HEAD/${path}`;

/** Beyond this a file tells you nothing and costs a second of frozen window. */
export const MAX_TEXT_BYTES = 200_000;

const IMAGE = /\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)$/i;
const BINARY =
  /\.(zip|gz|tgz|tar|7z|rar|pdf|woff2?|ttf|otf|eot|mp4|webm|mov|mp3|wav|ogg|wasm|exe|dll|so|dylib|jar|class|bin|db|sqlite|ico|psd|ai|sketch)$/i;
/** Machine-written and enormous; nobody reads these in a portfolio. */
const GENERATED = /^(bun\.lock|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|go\.sum|Cargo\.lock|composer\.lock)$/i;

export type FileKind = "text" | "image" | "binary" | "too-large" | "generated";

/** What a file is, decided before anything is fetched. */
export function classify(entry: TreeEntry): FileKind {
  if (IMAGE.test(entry.name)) return "image";
  if (GENERATED.test(entry.name)) return "generated";
  if (BINARY.test(entry.name)) return "binary";
  if (entry.size > MAX_TEXT_BYTES) return "too-large";
  return "text";
}

/** A file's text, straight from raw. Never cached — it is not rate limited. */
export async function fetchFile(
  owner: string,
  name: string,
  path: string
): Promise<string> {
  const response = await fetch(rawUrl(owner, name, path));
  if (!response.ok) throw new Error(`Could not read ${path}`);
  return response.text();
}
