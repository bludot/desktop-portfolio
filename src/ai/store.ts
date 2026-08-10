import { readCache, writeCache } from "../Store";
import type { VectorStore } from "@thatcatdev/browser-ai";

/**
 * The desktop's own cache, in the shape the library asks for.
 *
 * `@thatcatdev/browser-ai` deliberately has no opinion about storage — it takes
 * anything that can hold a value against a key. This desktop already has one:
 * the same IndexedDB table the GitHub reads are kept in, which means the
 * vectors survive a reload alongside everything else and are cleared by the
 * same "forget everything" in Settings.
 */
export const desktopStore: VectorStore = {
  async read(key) {
    const entry = await readCache<unknown>(key);
    return entry?.value;
  },
  async write(key, value) {
    await writeCache(key, value);
  }
};
