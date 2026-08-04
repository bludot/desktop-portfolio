import db, { AppDatabase } from './database'
import { FeatureFlag, type IFeatureFlag } from './FeatureFlags'

// Wire rows to their class here rather than in the AppDatabase constructor:
// this module is the one place that already depends on both halves, so the
// database and the record class never have to import each other at runtime.
db.featureFlags.mapToClass(FeatureFlag)

export { FEATURE_FLAG_DEFAULTS, isFeatureEnabled } from './features'
export type { FeatureFlagDefault } from './features'
export { AppDatabase }
export { db as default, FeatureFlag }
export type { IFeatureFlag }
