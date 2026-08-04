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

  // Nothing is declared at the moment, so there is nothing to seed.
  it('seeds nothing while no flags are declared', async () => {
    const app = new FeatureFlagsApp(makeDesktop())
    expect(await app.loadFeatures()).toEqual([])
    expect(await db.featureFlags.count()).toBe(0)
  })

  it('returns whatever rows already exist', async () => {
    await new FeatureFlag('experimental', 'Experimental', true).save()
    const app = new FeatureFlagsApp(makeDesktop())
    const flags = await app.loadFeatures()
    expect(flags.map((f) => f.code)).toEqual(['experimental'])
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
  it('exposes the default desktop image', () => {
    expect(settings.getDesktopImage().original).toBeTruthy()
  })

  it('setBootScreenImage stores the path', async () => {
    await settings.setBootScreenImage('/assets/boot.png')
    expect(settings.bootScreenImage).toBe('/assets/boot.png')
  })

  it('setDesktopImage records the original and both blurred variants', async () => {
    const blurimage = await import('../src/utils/blurimage')
    const spy = vi
      .spyOn(blurimage, 'blurImage')
      .mockResolvedValue('data:image/png;base64,stub')

    await settings.setDesktopImage('/assets/desk.jpg')

    expect(settings.getDesktopImage().original).toBe('/assets/desk.jpg')
    expect(settings.getDesktopImage().blurred30).toBe('data:image/png;base64,stub')
    expect(settings.getDesktopImage().blurred60).toBe('data:image/png;base64,stub')
    spy.mockRestore()
  })

  it('getSetting is a stub that returns nothing', () => {
    expect(settings.getSetting('anything')).toBeUndefined()
  })
})
