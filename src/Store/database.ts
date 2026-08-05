import Dexie from "dexie";
// Type-only, so this does not create a runtime cycle with FeatureFlags.ts.
import type { FeatureFlag } from "./FeatureFlags";
import type { Setting } from "./Settings";
import type { CacheEntry } from "./Cache";

export class AppDatabase extends Dexie {
  public featureFlags!: Dexie.Table<FeatureFlag, number>;
  public settings!: Dexie.Table<Setting, string>;
  public cache!: Dexie.Table<CacheEntry, string>;

  constructor() {
    super("AppDatabase");

    this.version(1).stores({
      featureFlags: '++id, code, name, enabled',
    });

    // Keyed by code rather than an auto id: a setting is looked up by name and
    // there is only ever one row per name, so the name is the key.
    this.version(2).stores({
      featureFlags: '++id, code, name, enabled',
      settings: 'code',
    });

    // Kept apart from settings: this is fetched data with an age, not a
    // preference, and resetting preferences should not clear it.
    this.version(3).stores({
      featureFlags: '++id, code, name, enabled',
      settings: 'code',
      cache: 'code',
    });
  }
}

// The singleton lives here, with no imports of its own beyond Dexie, so record
// classes can depend on it without the module graph forming a cycle. Mapping
// rows onto their classes happens in index.ts, once both halves exist.
const db = new AppDatabase();

export default db;
