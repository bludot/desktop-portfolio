import Dexie from "dexie";
import db from "./index"
class FeatureFlag implements IFeatureFlag {
  id: number;
  code: string;
  name: string;
  enabled: boolean;


  constructor(code: string, name: string, enabled: boolean = false, id?:number) {
    this.code = code;
    this.name = name
    this.enabled = enabled;
    if (id) this.id = id;
  }

  save() {
    return db.transaction('rw', db.featureFlags, async () => {
      // An id of undefined means this flag was never persisted, so there is
      // nothing to look up — Dexie rejects an undefined key.
      if (this.id !== undefined) {
        const existing = await db.featureFlags.get(this.id)
        if (existing) {
          return db.featureFlags.update(this.id, {enabled: this.enabled})
        }
      }
      // Insert is the explicit fallthrough rather than an exception handler, so
      // a row that has gone missing is re-created instead of silently dropped.
      const id = await db.featureFlags.put(
        new FeatureFlag(this.code, this.name, this.enabled, this.id)
      )
      this.id = id
      return id
    });
  }
}

interface IFeatureFlag {
  id?: number,
  code: string,
  name: string,
  enabled: boolean
}

export {FeatureFlag}
export type {IFeatureFlag}
