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
  semanticSearch: { name: "Semantic project search", enabled: false }

  /*
   * `localChat` was here, and is not any more.
   *
   * It guarded the better part of a gigabyte, which was the right instinct and
   * the wrong mechanism: the download never happened until the chat window was
   * opened, so the flag was not standing between a visitor and the bytes — the
   * window was, and still is. What the flag actually did was hide the feature
   * from everyone who did not know to look for it.
   *
   * The tile now carries a `beta` tag instead, which is the thing the flag was
   * really being used to say. Rows written to IndexedDB while the flag existed
   * stay where they are and are ignored — the Feature Flags window lists only
   * codes that still appear here, so a retired flag does not leave a switch
   * behind that is wired to nothing.
   */
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
