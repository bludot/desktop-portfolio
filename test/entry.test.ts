import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// The entry module runs everything at import time, so each case sets the URL,
// resets the module registry, then imports it fresh.
const opened: Array<{ name: string; position: any }> = []

vi.mock('../src/utils/windowManager', () => ({
  default: {
    new: vi.fn((opts: any) => {
      opened.push({ name: opts.title, position: opts.windowPosition ?? {} })
    }),
  },
}))

vi.mock('../src/components/Desktop', () => ({
  default: class Desktop {
    startup = vi.fn().mockResolvedValue(undefined)
    getElement = () => document.createElement('div')
    getTaskbar = () => ({ getElement: () => document.createElement('div') })
  },
}))

vi.mock('../src/components/Bootscreen', () => ({
  default: class Bootscreen {
    load = vi.fn().mockResolvedValue(undefined)
    unload = vi.fn().mockResolvedValue(undefined)
  },
}))

vi.mock('@fortawesome/fontawesome-svg-core', () => ({
  library: { add: vi.fn() },
  dom: { watch: vi.fn() },
}))

const bootWith = async (search: string) => {
  opened.length = 0
  window.history.replaceState({}, '', `/${search}`)
  document.body.innerHTML = '<div id="app"></div>'
  vi.resetModules()
  await import('../src/index')
  // startup() chains through promises before opening windows.
  await vi.waitFor(() => expect(opened.length).toBeGreaterThan(0))
}

const names = () => opened.map((w) => w.name)

describe('entry point window routing', () => {
  beforeEach(() => {
    opened.length = 0
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('opens About and Experience side by side by default', async () => {
    await bootWith('')
    expect(names()).toEqual(['About', 'Experience'])
    expect(opened[0].position).toEqual({ top: 30, left: 30 })
    expect(opened[1].position).toEqual({ top: 30, left: 600 })
  })

  // Regression: the ?windows= branch used to fall through to two unconditional
  // calls, so ?windows=about rendered About twice plus an unasked-for Experience.
  it('opens only the requested window', async () => {
    await bootWith('?windows=about')
    expect(names()).toEqual(['About'])
  })

  it('centres a lone window instead of offsetting it', async () => {
    await bootWith('?windows=experience')
    expect(names()).toEqual(['Experience'])
    expect(opened[0].position).toEqual({})
  })

  it('lays the pair out side by side when both are requested', async () => {
    await bootWith('?windows=about,experience')
    expect(names()).toEqual(['About', 'Experience'])
    expect(opened[0].position).toEqual({ top: 30, left: 30 })
    expect(opened[1].position).toEqual({ top: 30, left: 600 })
  })

  it('honours the order the params were given in', async () => {
    await bootWith('?windows=experience,about')
    expect(names()).toEqual(['Experience', 'About'])
  })

  it('ignores unknown window names', async () => {
    await bootWith('?windows=about,not-a-window')
    expect(names()).toEqual(['About'])
  })

  it('does not treat Object.prototype members as windows', async () => {
    await bootWith('?windows=about,toString,constructor')
    expect(names()).toEqual(['About'])
  })

  it('opens the debugger when ?debug=1 is set', async () => {
    await bootWith('?debug=1')
    expect(names()).toContain('Debugger')
  })

  it('opens the alert window when asked for', async () => {
    await bootWith('?windows=alert')
    // Titled by what happened, not by a generic error class.
    expect(names()).toEqual(["Couldn't open that"])
  })
})
