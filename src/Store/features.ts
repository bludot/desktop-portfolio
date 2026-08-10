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
  /*
   * Searching the repositories by meaning as well as by spelling.
   *
   * Off by default because it is the one thing on this desktop that fetches a
   * model: about 23MB, once, on the first launcher open. Everything it adds is
   * an addition — the literal matching underneath it is untouched — so a
   * visitor who never turns it on never knows it is there, which is the right
   * default for a page somebody landed on rather than chose.
   */
  semanticSearch: { name: "Semantic project search", enabled: false },

  /*
   * A chat window backed by a model on the visitor's own machine.
   *
   * Off for the same reason and more so: about 100MB, fetched the first time
   * the window is opened and never before. Nothing else on the desktop touches
   * it, so a visitor who leaves this alone never downloads a byte of it.
   */
  localChat: { name: "Local chat model", enabled: false }
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
