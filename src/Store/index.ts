import {FeatureFlag, IFeatureFlag} from './FeatureFlags'
import Dexie from "dexie";

export class AppDatabase extends Dexie {
  public featureFlags: Dexie.Table<FeatureFlag, number>;

  constructor() {

    super("AppDatabase");

    var db = this;

    //
    // Define tables and indexes
    //
    db.version(1).stores({
      featureFlags: '++id, code, name, enabled',
    });

    // Let's physically map Contact class to contacts table.
    // This will make it possible to call loadEmailsAndPhones()
    // directly on retrieved database objects.
    db.featureFlags.mapToClass(FeatureFlag);
  }

}

const db = new AppDatabase();

export {db as default, IFeatureFlag, FeatureFlag}
