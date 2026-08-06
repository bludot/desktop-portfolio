import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// The entry module runs everything at import time, so each case sets the URL,
// resets the module registry, then imports it fresh.
const opened: Array<{ name: string; position: any; dimensions: any }> = []

vi.mock('../src/utils/windowManager', () => ({
  default: {
    new: vi.fn((opts: any) => {
      opened.push({
        name: opts.title,
        position: opts.windowPosition ?? {},
        dimensions: opts.dimensions ?? {},
      })
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

/** Each opened window as a rectangle, in the order they were opened. */
const boxes = () =>
  opened.map((w) => ({
    name: w.name,
    left: w.position.left,
    top: w.position.top,
    right: w.position.left + w.dimensions.width,
    bottom: w.position.top + w.dimensions.height,
  }))

const overlaps = (a: any, b: any) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

describe('entry point window routing', () => {
  beforeEach(() => {
    opened.length = 0
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  /*
   * About last, so it is the window in front when the desktop settles — it is
   * the page that says who this is, and on a phone the windows stack, so the
   * last one opened is the only one really on screen.
   */
  it('opens Projects, Experience and About, in that order, by default', async () => {
    await bootWith('')
    expect(names()).toEqual(['Projects', 'Experience', 'About'])
  })

  // Laid out from the viewport rather than from a table of coordinates, so what
  // is worth asserting is the property that table was trying to produce.
  it('leaves every opening window wholly visible and uncovered', async () => {
    await bootWith('')
    const placed = boxes()

    placed.forEach((box) => {
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.top).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(window.innerWidth)
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
    })

    placed.forEach((box, i) =>
      placed.slice(i + 1).forEach((other) => {
        expect(overlaps(box, other)).toBe(false)
      }),
    )
  })

  // The widest window is the one with the most in it, whatever the scaling.
  it('keeps the proportions between them when it has to shrink them', async () => {
    await bootWith('')
    const [projects, experience, about] = boxes()
    expect(projects.right - projects.left).toBeGreaterThan(experience.right - experience.left)
    expect(experience.right - experience.left).toBeGreaterThan(about.right - about.left)
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
    const [about, experience] = boxes()
    expect(about.top).toBe(experience.top)
    expect(about.right).toBeLessThanOrEqual(experience.left)
    expect(overlaps(about, experience)).toBe(false)
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
