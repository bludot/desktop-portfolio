/**
 * What is running, as distinct from what is on screen.
 *
 * Until now the two were the same thing: every window built what it needed when
 * it opened and let go of it when it closed, which is right for a window that
 * renders a list of repositories and wrong for the one that brings up half a
 * gigabyte of weights. Closing the chat and opening it again rebuilt the model
 * — not re-downloaded, the browser had the files, but read back and compiled
 * into a graph, which is seconds of arithmetic to arrive at exactly the state
 * that had just been discarded.
 *
 * So: a process is something with a lifetime of its own. A window may start one
 * and every window may close without it stopping. It ends when it is killed, or
 * when the tab does.
 *
 * Deliberately not a thread. A process here is a named thing that is running,
 * an entry in a table, and something that can be stopped — the bookkeeping half
 * of the idea. Whether the work happens on this thread or on a worker is the
 * spec's business and nothing above this line can tell, which is what makes
 * moving one onto a worker a change to a single `start` function rather than to
 * everything that asks for it. The model service is already on a worker; the
 * next one that needs to be can follow without a new vocabulary.
 *
 * There is no fork, and there will not be one. A worker has no shared address
 * space and no copy-on-write — `postMessage` copies by serialising — so the one
 * part of the Unix model that does not survive the trip to a browser is the
 * part that makes forking worth doing. What survives is this: names, lifetimes,
 * a table you can read, and a way to kill something.
 */

/** What a process is made of, told once, at the point of asking for it. */
export interface Service<T> {
  /**
   * Unique. Asking twice by the same name gets what is already running rather
   * than a second copy — which is the whole point of the register.
   */
  name: string;
  /** What the process table calls it. */
  label: string;
  /**
   * One live line under the label, read at the moment the table is drawn.
   *
   * A function rather than a string because the interesting part of a process
   * is what it is doing now: which model is loaded, how many notes are indexed.
   */
  detail?: () => string | undefined;
  /** Build the thing. Called once, on the first ask. */
  start: () => T;
  /**
   * Take it down. Called by `kill`, and expected to release whatever `start`
   * took — terminate the worker, drop the caches, close the connection.
   */
  stop?: (resource: T) => void;
}

/** A process, as the table sees it. */
export interface Process {
  readonly id: number;
  readonly name: string;
  readonly label: string;
  /** When it started, so the table can say how long it has been up. */
  readonly since: Date;
  detail(): string | undefined;
  kill(): void;
}

interface Entry<T = unknown> {
  id: number;
  service: Service<T>;
  resource: T;
  since: Date;
}

const entries = new Map<string, Entry>();
const watchers = new Set<() => void>();
let sequence = 0;

function announce() {
  // Copied first: a watcher that kills something while being told about it
  // would otherwise mutate the set being walked.
  [...watchers].forEach((watcher) => watcher());
}

/**
 * The running thing under this name, started if it is not already.
 *
 * The resource comes back directly rather than wrapped, so a caller that wants
 * the worker gets the worker. Everything about it being a process is on the
 * side, for the table to read.
 */
export function ensure<T>(service: Service<T>): T {
  const running = entries.get(service.name) as Entry<T> | undefined;
  if (running) return running.resource;

  const entry: Entry<T> = {
    id: ++sequence,
    service,
    resource: service.start(),
    since: new Date()
  };
  entries.set(service.name, entry as Entry);
  announce();
  return entry.resource;
}

/** Whether anything is running under this name. Starts nothing. */
export function running(name: string): boolean {
  return entries.has(name);
}

/**
 * Stop it, if it is running.
 *
 * Removed from the register before `stop` is called, so a service whose
 * teardown reaches back into the desktop — dropping a cache that another
 * process would otherwise rebuild from — finds itself already gone rather than
 * halfway out.
 */
export function kill(name: string): void {
  const entry = entries.get(name);
  if (!entry) return;
  entries.delete(name);
  try {
    entry.service.stop?.(entry.resource);
  } finally {
    announce();
  }
}

/** Everything running, oldest first — the order they were started in. */
export function list(): Process[] {
  return [...entries.values()]
    .sort((a, b) => a.id - b.id)
    .map((entry) => ({
      id: entry.id,
      name: entry.service.name,
      label: entry.service.label,
      since: entry.since,
      detail: () => entry.service.detail?.(),
      kill: () => kill(entry.service.name)
    }));
}

/**
 * Be told when the table changes.
 *
 * Returns the way to stop being told, which the process window calls when it
 * unloads — a watcher holding a closed window's element is how a list that is
 * no longer on screen goes on redrawing itself.
 */
export function watch(watcher: () => void): () => void {
  watchers.add(watcher);
  return () => watchers.delete(watcher);
}

/** For tests, which should not inherit a register from the case before. */
export function reset(): void {
  [...entries.keys()].forEach(kill);
  watchers.clear();
  sequence = 0;
}
