import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import App from '../src/apps/App'
import KeyCatcher from '../src/apps/KeyCatcher'
import FeatureFlagsApp from '../src/apps/FeatureFlags'
import settings from '../src/utils/settings'
import windowManager from '../src/utils/windowManager'
import db, { FeatureFlag } from '../src/Store'

jss.setup(preset())
jss.use(nested())

const makeDesktop = () =>
  ({
    getElement: () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      return el
    },
    getTaskbar: () => ({ getElement: () => document.createElement('div') }),
  }) as any

const type = (text: string) => {
  for (const key of text) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  }
}

describe('App', () => {
  it('keeps the name it was given', () => {
    expect(new App('Thing').name).toBe('Thing')
  })
})

describe('KeyCatcher', () => {
  it('is a singleton', () => {
    expect(new KeyCatcher(makeDesktop())).toBe(new KeyCatcher(makeDesktop()))
  })

  it('runs the handler when a registered sequence is typed', () => {
    const catcher = new KeyCatcher(makeDesktop())
    const action = vi.fn()
    catcher.addSequence('opensesame', action)
    catcher.startListener()

    type('opensesame')

    expect(action).toHaveBeenCalled()
  })

  it('ignores sequences that were never registered', () => {
    const catcher = new KeyCatcher(makeDesktop())
    const action = vi.fn()
    catcher.addSequence('zzzunique', action)
    catcher.startListener()

    type('somethingelse')

    expect(action).not.toHaveBeenCalled()
  })

  it('starts a fresh buffer once the keystroke delay lapses', () => {
    vi.useFakeTimers()
    const catcher = new KeyCatcher(makeDesktop())
    const action = vi.fn()
    catcher.addSequence('ab', action)
    catcher.startListener()

    type('a')
    vi.advanceTimersByTime(1000)
    type('b')

    // The pause split the buffer, so "ab" was never seen as one sequence.
    expect(action).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('addSequence overwrites an existing binding', () => {
    const catcher = new KeyCatcher(makeDesktop())
    const first = vi.fn()
    const second = vi.fn()
    catcher.addSequence('dup', first)
    catcher.addSequence('dup', second)
    catcher.startListener()

    type('dup')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalled()
  })
})

describe('FeatureFlagsApp', () => {
  beforeEach(async () => {
    await db.featureFlags.clear()
  })

  afterEach(() => {
    windowManager.windows.head = null
    windowManager.windows.tail = null
    windowManager.windows.length = 0
  })

  // Opening the app is what writes the declared flags down, so somebody can
  // turn them on — until then the defaults are all that ship.
  it('seeds the declared flags, off', async () => {
    const app = new FeatureFlagsApp(makeDesktop())
    const flags = await app.loadFeatures()

    expect(flags.map((f) => f.code)).toEqual(['semanticSearch'])
    expect(flags.every((f) => !f.enabled)).toBe(true)
    expect(await db.featureFlags.count()).toBe(1)
  })

  /*
   * A retired flag leaves its row behind in everybody's IndexedDB. Offering it
   * would put a switch on screen wired to code that no longer reads it, which
   * is worse than not offering it at all: it looks like it does something.
   * `localChat` is the first to go this way.
   */
  it('does not offer a row whose flag no longer exists', async () => {
    await new FeatureFlag('localChat', 'Local chat model', true).save()
    const app = new FeatureFlagsApp(makeDesktop())
    const flags = await app.loadFeatures()

    expect(flags.map((f) => f.code)).toEqual(['semanticSearch'])
    // Left where it is rather than deleted — it costs nothing, and a flag that
    // comes back should find what somebody chose last time.
    expect(await db.featureFlags.where({ code: 'localChat' }).count()).toBe(1)
  })

  it('opens a window listing each flag', async () => {
    const app = new FeatureFlagsApp(makeDesktop())
    app.load()

    await vi.waitFor(() => expect(windowManager.windows.head).toBeTruthy())
    const win = windowManager.windows.head!.value.window
    expect(win.title).toBe('FeatureFlagsApp')
  })
})

describe('settings', () => {
  it('exposes a boot screen path', () => {
    expect(settings.bootScreenImage).toBeTruthy()
  })

  it('setBootScreenImage stores the path', async () => {
    await settings.setBootScreenImage('/assets/boot.png')
    expect(settings.bootScreenImage).toBe('/assets/boot.png')
  })

  it('getSetting is a stub that returns nothing', () => {
    expect(settings.getSetting('anything')).toBeUndefined()
  })
})
