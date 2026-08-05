import db from "./database";

/**
 * One stored preference, keyed by its own name.
 *
 * Values are JSON so a setting can be a string, a boolean, or later something
 * with structure, without a migration each time one is added.
 */
class Setting implements ISetting {
  code: string;
  value: string;

  constructor(code: string, value: string) {
    this.code = code;
    this.value = value;
  }

  save() {
    return db.settings.put(new Setting(this.code, this.value));
  }
}

interface ISetting {
  code: string;
  value: string;
}

/** Everything stored, as a plain object. Unreadable rows are skipped. */
export async function loadSettings(): Promise<Record<string, unknown>> {
  const rows = await db.settings.toArray();
  return rows.reduce<Record<string, unknown>>((all, row) => {
    try {
      all[row.code] = JSON.parse(row.value);
    } catch {
      // A row written by an older build, or corrupted: fall back to the
      // default rather than taking the desktop down on boot.
    }
    return all;
  }, {});
}

export async function saveSettings(values: object) {
  await db.settings.bulkPut(
    Object.entries(values).map(
      ([code, value]) => new Setting(code, JSON.stringify(value))
    )
  );
}

export async function clearSettings() {
  await db.settings.clear();
}

export { Setting };
export type { ISetting };
