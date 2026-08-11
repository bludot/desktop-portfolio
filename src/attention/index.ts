/**
 * What the desktop has noticed, and nothing more than that.
 *
 * Everything here is derived from the window manager's own events — opened,
 * closed, focused — which is the whole of what this desktop knows about a
 * visitor. There is no pointer tracking, no scroll depth, no dwell heatmap and
 * no reading of what anybody typed. Not because those are hard, but because the
 * useful suggestions do not need them: somebody who has opened Projects three
 * times and closed it again has told you what they want in three events.
 *
 * It is held in memory and dies with the tab. Nothing is written to IndexedDB,
 * nothing is sent anywhere, and there is nowhere for it to go — the desktop has
 * no server of its own. That is worth saying plainly wherever this surfaces,
 * because "we noticed what you were doing" is a sentence that has earned its
 * suspicion elsewhere.
 */
import windowManager from "../utils/windowManager";

export interface Activity {
  /** When the desktop came up. */
  readonly since: Date;
  /** How many times each window has been opened, by title. */
  readonly opened: ReadonlyMap<string, number>;
  /** And closed again. */
  readonly closed: ReadonlyMap<string, number>;
  /** What is on screen now. */
  readonly open: readonly string[];
  /** How long the desktop has been up, in seconds. */
  readonly seconds: number;
}

const openedCounts = new Map<string, number>();
const closedCounts = new Map<string, number>();
let onScreen: string[] = [];
let started = new Date();
let subscription: { unsubscribe: () => void } | undefined;

type Watcher = (activity: Activity) => void;
const watchers = new Set<Watcher>();

/** Now, as a plain value anything may read and nothing may change. */
export function activity(now: Date = new Date()): Activity {
  return {
    since: started,
    opened: new Map(openedCounts),
    closed: new Map(closedCounts),
    open: [...onScreen],
    seconds: Math.max(0, Math.round((now.getTime() - started.getTime()) / 1000))
  };
}

/**
 * Work out what changed, by comparing what is open now with what was.
 *
 * The manager says only that *something* moved, so the difference has to be
 * taken here. Titles rather than window objects: a window closed and opened
 * again is a new object and the same intent, and intent is what this is for.
 */
function reconcile() {
  const now = windowManager.list().map((w) => w.title);

  now.filter((title) => !onScreen.includes(title)).forEach((title) => {
    openedCounts.set(title, (openedCounts.get(title) ?? 0) + 1);
  });
  onScreen
    .filter((title) => !now.includes(title))
    .forEach((title) => {
      closedCounts.set(title, (closedCounts.get(title) ?? 0) + 1);
    });

  onScreen = now;
  const snapshot = activity();
  watchers.forEach((watcher) => watcher(snapshot));
}

/** Start noticing. Safe to call twice; the second is a no-op. */
export function watch(): void {
  if (subscription) return;
  started = new Date();
  subscription = windowManager.subscribe(reconcile);
  // The desktop opens windows of its own before this runs, and those count.
  reconcile();
}

/** Be told when it changes. Returns the way to stop being told. */
export function onChange(watcher: Watcher): () => void {
  watchers.add(watcher);
  return () => watchers.delete(watcher);
}

/** Stop, and forget. For tests, and for anything that wants to opt out. */
export function forget(): void {
  subscription?.unsubscribe();
  subscription = undefined;
  openedCounts.clear();
  closedCounts.clear();
  onScreen = [];
  watchers.clear();
  started = new Date();
}
