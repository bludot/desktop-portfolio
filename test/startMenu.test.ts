import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import StartMenu from '../src/components/StartMenu'
import { icon, markFor } from '../src/components/Icon'
import { APPS } from '../src/apps/external'
import windowManager from '../src/utils/windowManager'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

const makeDesktop = (over: Record<string, unknown> = {}) => {
  const root = document.createElement('div')
  const taskbar = document.createElement('div')
  document.body.appendChild(root)
  return {
    getElement: () => root,
    getTaskbar: () => ({ getElement: () => taskbar }),
    launcher: { toggle: vi.fn().mockResolvedValue(undefined) },
    ...over,
  } as any
}

const cells = () => [...host.querySelectorAll<HTMLElement>('.start-cell')]
const cell = (label: string) =>
  cells().find((c) => c.querySelector('.start-label')?.textContent === label)!
const pill = (label: string) =>
  [...host.querySelectorAll<HTMLElement>('.start-pill')].find(
    (p) => p.textContent === label,
  )!

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(async () => {
  // The manager is a singleton, so a window left open leaks into the next test.
  for (const open of windowManager.list()) windowManager.remove(open.window)
  host.remove()
})

describe('the icon set', () => {
  it('draws every mark from one place', () => {
    const mark = icon('projects')
    expect(mark.tagName.toLowerCase()).toBe('svg')
    // Namespaced, or the browser lays the element out and draws nothing inside.
    expect(mark.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  /*
   * Deliberately unsized: every surface has its own idea of how big an icon is,
   * and an attribute the element brought with it beats nothing while a
   * stylesheet rule beats the attribute.
   */
  it('leaves the size to whatever it is put in', () => {
    const mark = icon('about')
    expect(mark.hasAttribute('width')).toBe(false)
    expect(mark.hasAttribute('height')).toBe(false)
  })

  // Regression: the taskbar kept its own three-entry glyph table, so the
  // Projects chip — and every app chip — had a label and no mark.
  it('has a mark for every window the desktop opens', () => {
    ;['About', 'Experience', 'Projects', 'Settings', 'Debugger'].forEach((title) => {
      expect(markFor(title), title).toBeTruthy()
    })
  })

  it('draws an app with its own favicon rather than a glyph', () => {
    const mark = markFor(APPS[0].name)!
    expect(mark.querySelector('img')?.getAttribute('src')).toBe(APPS[0].icon)
  })

  // A wrong icon reads as a bug in a way that no icon does not.
  it('gives nothing for a window it does not know', () => {
    expect(markFor('Some Window Nobody Registered')).toBeUndefined()
  })
})

describe('StartMenu', () => {
  it('lays every destination out as a tile', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)

    const labels = cells().map((c) => c.querySelector('.start-label')?.textContent)
    expect(labels).toEqual([
      'About',
      'Experience',
      'Projects',
      'Contact',
      ...APPS.map((app) => app.name),
    ])
    await menu.unload()
  })

  /*
   * The switches are not destinations. A tile promises a place you go, and
   * these three open a settings window, a log and a list of flags — and having
   * them here is what ends the mobile-only feature-flags row.
   */
  it('keeps the switches as pills, at every width', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)

    expect(pill('Settings')).toBeTruthy()
    expect(pill('Debugger')).toBeTruthy()
    expect(pill('Feature flags')).toBeTruthy()
    await menu.unload()
  })

  /*
   * A dot in the corner of an icon is the notification affordance. Spending it
   * on "this window is already open" would leave nothing to say with when
   * something actually wants attention — and the taskbar already lists what is
   * running, which is the surface for that.
   */
  it('puts no badge on a tile, open or not', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)

    cell('About').click()
    await menu.unload()
    await menu.load(host)

    expect(host.querySelector('.start-open')).toBeNull()
    expect(cell('About').querySelector('.start-meta')).toBeNull()
    await menu.unload()
  })

  /*
   * Half of what a start menu gets pressed for is going back to something that
   * already exists. Opening a second copy of About is never what was meant.
   */
  it('goes back to an open window rather than building another', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)

    cell('About').click()
    expect(windowManager.list()).toHaveLength(1)

    await menu.unload()
    await menu.load(host)
    cell('About').click()

    expect(windowManager.list()).toHaveLength(1)
    await menu.unload()
  })

  it('brings back a window that was minimised', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)
    cell('About').click()

    const about = windowManager.list()[0].window
    await about.minimize()
    expect(about.minimized).toBe(true)

    await menu.unload()
    await menu.load(host)
    cell('About').click()

    expect(about.minimized).toBe(false)
    expect(windowManager.list()).toHaveLength(1)
    await menu.unload()
  })

  it('puts itself away whatever was pressed', async () => {
    const dismiss = vi.fn()
    const menu = new StartMenu(makeDesktop(), dismiss)
    await menu.load(host)

    cell('Experience').click()
    expect(dismiss).toHaveBeenCalledTimes(1)

    pill('Settings').click()
    expect(dismiss).toHaveBeenCalledTimes(2)
    await menu.unload()
  })

  /*
   * The launcher is the search surface. This menu hands off to it rather than
   * growing a second field, so there is one place to type on the whole desktop.
   */
  it('hands search to the launcher', async () => {
    const desktop = makeDesktop()
    const dismiss = vi.fn()
    const menu = new StartMenu(desktop, dismiss)
    await menu.load(host)

    host.querySelector<HTMLElement>('.start-search')!.click()

    expect(desktop.launcher.toggle).toHaveBeenCalled()
    expect(dismiss).toHaveBeenCalled()
    await menu.unload()
  })

  // What James is, not what the desktop is doing — the taskbar answers that.
  it('says the same thing about availability however much is open', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)
    expect(host.querySelector('.start-status')?.textContent).toBe(
      'available for work',
    )

    cell('Projects').click()
    await menu.unload()
    await menu.load(host)

    expect(host.querySelector('.start-status')?.textContent).toBe(
      'available for work',
    )
    expect(host.querySelector('.start-pip')).toBeTruthy()
    await menu.unload()
  })

  /*
   * Regression: the panel was pinned 58px up, which is the bar's height plus a
   * gap — but the bar floats on a 15px margin at this width, so the board ran
   * seven pixels underneath it and the taskbar's higher z-index drew over the
   * corner. The room the bar takes is measured, never assumed.
   */
  it('sits above the taskbar, wherever the taskbar actually is', async () => {
    const taskbar = document.createElement('div')
    document.body.appendChild(taskbar)
    // 50px tall, floating on a 15px margin: its top edge is 65px off the floor.
    vi.spyOn(taskbar, 'getBoundingClientRect').mockReturnValue({
      top: window.innerHeight - 65,
      height: 50,
    } as DOMRect)

    const menu = new StartMenu(
      makeDesktop({ getTaskbar: () => ({ getElement: () => taskbar }) }),
    )
    await menu.load(host)

    expect(menu.getElement().style.getPropertyValue('--taskbar-floor')).toBe('65px')
    await menu.unload()
    taskbar.remove()
  })

  it('falls back to the bar at its full size when it cannot be measured', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)
    // jsdom reports zeros for a detached element; guessing 50 would overlap.
    expect(menu.getElement().style.getPropertyValue('--taskbar-floor')).toBe('65px')
    await menu.unload()
  })

  // Reopening used to append the generated class to a className that only grew.
  it('can be opened and closed repeatedly', async () => {
    const menu = new StartMenu(makeDesktop())
    for (let i = 0; i < 3; i++) {
      await menu.load(host)
      expect(host.querySelector('.start-menu')).toBeTruthy()
      await menu.unload()
      expect(host.querySelector('.start-menu')).toBeNull()
    }
    expect(menu.getElement().className.split(/\s+/).length).toBeLessThan(4)
  })
})
