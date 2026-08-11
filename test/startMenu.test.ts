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
      'Chat',
      'Contact',
      ...APPS.map((app) => app.name),
    ])
    await menu.unload()
  })

  /*
   * The chat window is new, and it is a small model that invents things. That
   * is worth saying on the tile, before the press rather than after it — it is
   * what the feature flag was really being used to say, back when finding the
   * window at all required knowing to look in Settings for it.
   *
   * In the tag's own slot rather than the meta line's: a tile is about 78px
   * wide, and "local · beta" does not fit in it.
   */
  it('marks the chat tile beta, and says nothing else about it', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)

    const chat = cell('Chat')
    expect(chat.querySelector('.start-tag')?.textContent).toBe('beta')
    expect(chat.querySelector('.start-meta')).toBeNull()
    await menu.unload()
  })

  // No flag in front of it any more: the download waits for the window, so the
  // tile costs nothing to show and hiding it only hid the feature.
  it('offers chat without anything having to be turned on', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)

    expect(cell('Chat')).toBeTruthy()
    await menu.unload()
  })

  /*
   * The switches are not destinations. A tile promises a place you go, and
   * these four open a settings window, a log, a list of flags and a list of
   * what is running — and having them here is what ends the mobile-only
   * feature-flags row.
   */
  it('keeps the switches as pills, at every width', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)

    expect(pill('Settings')).toBeTruthy()
    expect(pill('Debugger')).toBeTruthy()
    expect(pill('Feature flags')).toBeTruthy()
    expect(pill('Processes')).toBeTruthy()
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
    const menu = new StartMenu(makeDesktop())
    await menu.open(host)
    expect(menu.isOpen).toBe(true)

    cell('Experience').click()
    await vi.waitFor(() => expect(menu.isOpen).toBe(false))
    expect(host.querySelector('.start-menu')).toBeNull()

    await menu.open(host)
    pill('Settings').click()
    await vi.waitFor(() => expect(menu.isOpen).toBe(false))
  })

  /*
   * The launcher is the search surface. This menu hands off to it rather than
   * growing a second field, so there is one place to type on the whole desktop.
   */
  it('hands search to the launcher', async () => {
    const desktop = makeDesktop()
    const menu = new StartMenu(desktop)
    await menu.open(host)

    host.querySelector<HTMLElement>('.start-search')!.click()

    expect(desktop.launcher.toggle).toHaveBeenCalled()
    await vi.waitFor(() => expect(menu.isOpen).toBe(false))
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

/*
 * The bug that kept coming back: press the button, nothing appears; press it
 * again and it works. It was never one mistake — it was two records of whether
 * the board was up (a boolean in the taskbar, and the DOM), with the boolean
 * flipped at the *start* of a transition and the DOM catching up 140–220ms
 * later. Anything landing in that gap, or any failure in it, left the two
 * disagreeing for good, and from then on every press toggled a phantom.
 *
 * These pin the invariant rather than the symptom: the phase is only ever
 * "open" when the element is mounted, and every path ends with the two agreeing.
 */
describe('opening and closing, for good', () => {
  const anchorButton = () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    return button
  }

  it('reports itself open only while it is actually mounted', async () => {
    const menu = new StartMenu(makeDesktop())
    expect(menu.isOpen).toBe(false)

    await menu.open(host)
    expect(menu.isOpen).toBe(true)
    expect(host.querySelector('.start-menu')).toBeTruthy()

    await menu.close()
    expect(menu.isOpen).toBe(false)
    expect(host.querySelector('.start-menu')).toBeNull()
  })

  it('toggles honestly however fast it is pressed', async () => {
    const menu = new StartMenu(makeDesktop())
    const host2 = host

    // Six presses with no waiting between them: they queue rather than race.
    const presses = Array.from({ length: 6 }, () => menu.toggle(host2))
    await Promise.all(presses)

    // Six is even, so it ends shut — and shut means gone, not merely flagged.
    expect(menu.isOpen).toBe(false)
    expect(host.querySelector('.start-menu')).toBeNull()

    await menu.toggle(host2)
    expect(menu.isOpen).toBe(true)
    expect(host.querySelector('.start-menu')).toBeTruthy()
    await menu.close()
  })

  /*
   * The specific race that broke it: a press landing inside the exit animation.
   * The old code had already set the state to "closed", so the press opened —
   * and then the close it had interrupted finished and unloaded the element the
   * open had just mounted.
   */
  it('survives a press landing inside the closing animation', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.open(host)

    const closing = menu.close()
    const reopening = menu.toggle(host)
    await Promise.all([closing, reopening])

    expect(menu.isOpen).toBe(true)
    expect(host.querySelector('.start-menu')).toBeTruthy()
    expect(host.querySelector('.start-menu')!.isConnected).toBe(true)
    await menu.close()
  })

  /*
   * And the reverse: something dismissing it while it is still coming up.
   */
  it('survives a dismissal landing inside the opening animation', async () => {
    const menu = new StartMenu(makeDesktop())

    const opening = menu.open(host)
    const closing = menu.close()
    await Promise.all([opening, closing])

    expect(menu.isOpen).toBe(false)
    expect(host.querySelector('.start-menu')).toBeNull()
  })

  /*
   * A teardown that throws used to strand the panel: the element stayed
   * mounted, `parent` stayed set, and every later open decided it was already
   * up and did nothing at all.
   */
  it('recovers when its own teardown fails', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.open(host)

    const boom = vi
      .spyOn(menu as any, 'beforeUnload')
      .mockRejectedValueOnce(new Error('scrollbar exploded'))

    await menu.close()
    expect(menu.isOpen).toBe(false)
    expect(host.querySelector('.start-menu')).toBeNull()

    boom.mockRestore()
    // The real proof: it still opens afterwards.
    await menu.open(host)
    expect(menu.isOpen).toBe(true)
    expect(host.querySelector('.start-menu')).toBeTruthy()
    await menu.close()
  })

  it('closes on a press outside it', async () => {
    const anchor = anchorButton()
    const menu = new StartMenu(makeDesktop())
    await menu.open(host, anchor)

    document.body.click()
    await vi.waitFor(() => expect(menu.isOpen).toBe(false))
    anchor.remove()
  })

  // The board's own padding is part of the board. Testing only against the
  // button, as this once did, closed the menu on a press between the tiles.
  it('stays up for a press on its own background', async () => {
    const anchor = anchorButton()
    const menu = new StartMenu(makeDesktop())
    await menu.open(host, anchor)

    host.querySelector<HTMLElement>('.start-grid')!.click()
    await new Promise((r) => setTimeout(r, 20))

    expect(menu.isOpen).toBe(true)
    await menu.close()
    anchor.remove()
  })

  // The button toggles itself; it must not also be read as a dismissal, or the
  // press would close and reopen in the same gesture.
  it('leaves a press on its own button to the button', async () => {
    const anchor = anchorButton()
    const menu = new StartMenu(makeDesktop())
    await menu.open(host, anchor)

    anchor.click()
    await new Promise((r) => setTimeout(r, 20))

    expect(menu.isOpen).toBe(true)
    await menu.close()
    anchor.remove()
  })
})
