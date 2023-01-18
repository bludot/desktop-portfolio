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
    return db.transaction('rw', db.featureFlags,async () => {
      const exists = await db.featureFlags.get(this.id)
      if (exists) {
        return db.featureFlags.update(this.id, {enabled: this.enabled})
      }
        return db.featureFlags.put(new FeatureFlag(this.code, this.name, this.enabled, this.id))
            .then(id => this.id = id);
        });
  }
}

interface IFeatureFlag {
  id?: number,
  code: string,
  name: string,
  enabled: boolean
}

export {FeatureFlag, IFeatureFlag}
