import db from "./database";

export interface FeatureFlagDefault {
  name: string;
  enabled: boolean;
}

/**
 * The known flags and how they behave before anyone touches them. Rows are only
 * written to IndexedDB when the Feature Flags app is opened, so most sessions
 * have nothing stored and these values are what actually ship.
 */
export const FEATURE_FLAG_DEFAULTS: Record<string, FeatureFlagDefault> = {
  // Empty for now. The overlay scrollbar used to live here; it is part of the
  // product proper and no longer gated.
};

/**
 * A stored row always wins, so anyone who has explicitly turned a flag off keeps
 * it off; otherwise the default applies.
 */
export async function isFeatureEnabled(code: string): Promise<boolean> {
  const [stored] = await db.featureFlags.where({ code }).toArray();
  if (stored) return stored.enabled;
  return FEATURE_FLAG_DEFAULTS[code]?.enabled ?? false;
}
