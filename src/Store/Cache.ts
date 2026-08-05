import db from "./database";

/**
 * Fetched data, kept so a second visit does not have to ask again.
 *
 * Separate from settings because this is not a preference: it has an age, it
 * can be thrown away at any time without losing anything, and clearing your
 * settings should not clear it.
 */
class CacheEntry implements ICacheEntry {
  code: string;
  value: string;
  fetchedAt: number;

  constructor(code: string, value: string, fetchedAt: number) {
    this.code = code;
    this.value = value;
    this.fetchedAt = fetchedAt;
  }
}

interface ICacheEntry {
  code: string;
  value: string;
  fetchedAt: number;
}

export interface Cached<T> {
  value: T;
  fetchedAt: number;
}

/**
 * Whatever is stored under this code, however old.
 *
 * Age is reported rather than enforced so the caller can decide: fresh enough
 * to use outright, or stale but still worth showing while a refetch runs.
 */
export async function readCache<T>(
  code: string,
  now: number = Date.now()
): Promise<Cached<T> | undefined> {
  try {
    const row = await db.cache.get(code);
    if (!row) return undefined;
    return {
      value: JSON.parse(row.value) as T,
      // Guards against a clock that has gone backwards since the write.
      fetchedAt: Math.min(row.fetchedAt, now)
    };
  } catch {
    // Unreadable or unavailable: the caller falls back to fetching, which is
    // the same thing it would do on a miss.
    return undefined;
  }
}

export async function writeCache(
  code: string,
  value: unknown,
  now: number = Date.now()
): Promise<void> {
  try {
    await db.cache.put(new CacheEntry(code, JSON.stringify(value), now));
  } catch {
    // A cache that cannot be written is a slower desktop, not a broken one.
  }
}

export { CacheEntry };
export type { ICacheEntry };
