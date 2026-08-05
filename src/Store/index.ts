import db, { AppDatabase } from './database'
import { FeatureFlag, type IFeatureFlag } from './FeatureFlags'
import { Setting } from './Settings'

// Wire rows to their class here rather than in the AppDatabase constructor:
// this module is the one place that already depends on both halves, so the
// database and the record class never have to import each other at runtime.
db.featureFlags.mapToClass(FeatureFlag)
db.settings.mapToClass(Setting)

export { FEATURE_FLAG_DEFAULTS, isFeatureEnabled } from './features'
export type { FeatureFlagDefault } from './features'
export { AppDatabase }
export { loadSettings, saveSettings, clearSettings, Setting } from './Settings'
export type { ISetting } from './Settings'
export { db as default, FeatureFlag }
export type { IFeatureFlag }
