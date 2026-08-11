import { describe, it, expect, beforeEach } from 'vitest'
import db, { FeatureFlag, FEATURE_FLAG_DEFAULTS, isFeatureEnabled } from '../src/Store'

describe('FeatureFlag', () => {
  beforeEach(async () => {
    await db.featureFlags.clear()
  })

  it('defaults enabled to false and leaves id unset', () => {
    const flag = new FeatureFlag('custom_scrollbar', 'custom scrollbar')
    expect(flag.code).toBe('custom_scrollbar')
    expect(flag.name).toBe('custom scrollbar')
    expect(flag.enabled).toBe(false)
    expect(flag.id).toBeUndefined()
  })

  it('accepts an explicit enabled value and id', () => {
    const flag = new FeatureFlag('a', 'A', true, 7)
    expect(flag.enabled).toBe(true)
    expect(flag.id).toBe(7)
  })

  it('rows come back as FeatureFlag instances, not plain objects', async () => {
    await new FeatureFlag('mapped', 'Mapped').save()
    const [row] = await db.featureFlags.toArray()
    expect(row).toBeInstanceOf(FeatureFlag)
  })

  describe('save', () => {
    it('inserts a new flag and assigns it an id', async () => {
      const flag = new FeatureFlag('custom_scrollbar', 'custom scrollbar')
      await flag.save()

      expect(flag.id).toBeTypeOf('number')
      const rows = await db.featureFlags.toArray()
      expect(rows).toHaveLength(1)
      expect(rows[0].code).toBe('custom_scrollbar')
      expect(rows[0].enabled).toBe(false)
    })

    it('updates in place rather than inserting a duplicate', async () => {
      const flag = new FeatureFlag('custom_scrollbar', 'custom scrollbar')
      await flag.save()
      const id = flag.id

      flag.enabled = true
      await flag.save()

      const rows = await db.featureFlags.toArray()
      expect(rows).toHaveLength(1)
      expect(rows[0].id).toBe(id)
      expect(rows[0].enabled).toBe(true)
    })

    // Regression: save() used to insert only from its catch block. The try
    // returned early when the row was absent, so a flag whose row had been
    // deleted was silently dropped instead of being written back.
    it('re-creates a row that was deleted out from under the object', async () => {
      const flag = new FeatureFlag('custom_scrollbar', 'custom scrollbar')
      await flag.save()
      const id = flag.id

      await db.featureFlags.delete(id)
      expect(await db.featureFlags.toArray()).toHaveLength(0)

      flag.enabled = true
      await flag.save()

      const rows = await db.featureFlags.toArray()
      expect(rows).toHaveLength(1)
      expect(rows[0].enabled).toBe(true)
      expect(rows[0].code).toBe('custom_scrollbar')
    })

    it('keeps separate flags separate', async () => {
      await new FeatureFlag('one', 'One').save()
      await new FeatureFlag('two', 'Two', true).save()

      const rows = await db.featureFlags.orderBy('code').toArray()
      expect(rows.map((r) => r.code)).toEqual(['one', 'two'])
      expect(rows.map((r) => r.enabled)).toEqual([false, true])
    })

    it('is queryable by the indexed code field', async () => {
      await new FeatureFlag('custom_scrollbar', 'custom scrollbar', true).save()
      const found = await db.featureFlags.where({ code: 'custom_scrollbar' }).toArray()
      expect(found).toHaveLength(1)
      expect(found[0].enabled).toBe(true)
    })
  })
})

describe('isFeatureEnabled', () => {
  beforeEach(async () => {
    await db.featureFlags.clear()
  })

  /*
   * The one declared flag gates something the launcher fetches without being
   * asked, and it ships off: a visitor who landed here rather than chose to be
   * should not be fetching weights because they opened a menu.
   *
   * `localChat` is deliberately not among them any more. It guarded a download
   * that only ever happened when the chat window was opened, so the window was
   * the gate and the flag was only hiding the feature.
   */
  it('declares only the flag that downloads behind somebody\'s back, and it is off', () => {
    expect(Object.keys(FEATURE_FLAG_DEFAULTS)).toEqual(['semanticSearch'])
    Object.values(FEATURE_FLAG_DEFAULTS).forEach((flag) => {
      expect(flag.enabled, flag.name).toBe(false)
    })
  })

  it('reports a declared flag from its default when nothing is stored', async () => {
    await expect(isFeatureEnabled('semanticSearch')).resolves.toBe(false)
  })

  it('lets a stored row override a declared default', async () => {
    await new FeatureFlag('localChat', 'Local chat model', true).save()
    await expect(isFeatureEnabled('localChat')).resolves.toBe(true)
  })

  it('reports an undeclared flag as off', async () => {
    await expect(isFeatureEnabled('not_a_flag')).resolves.toBe(false)
  })

  it('lets a stored row decide even for an undeclared flag', async () => {
    await new FeatureFlag('experimental', 'Experimental', true).save()
    await expect(isFeatureEnabled('experimental')).resolves.toBe(true)
  })
})

describe('AppDatabase', () => {
  it('exposes the featureFlags table', () => {
    expect(db.featureFlags).toBeDefined()
    expect(db.name).toBe('AppDatabase')
  })
})
