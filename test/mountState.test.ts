import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import OSElement from '../src/utils/OSElement'
import StartMenu from '../src/components/StartMenu'
import windowManager from '../src/utils/windowManager'

jss.setup(preset())
jss.use(nested())

/**
 * Where "am I on screen?" is kept, and why the answer goes stale.
 *
 * `OSElement` records its mounting as a `parent` pointer and refuses to load
 * again while it is set. The DOM, meanwhile, records it by actually containing
 * the element — and only one of those two can be taken away by somebody else.
 * Anything that removes the element without going through `unload()` leaves the
 * pointer insisting the component is mounted and the DOM disagreeing.
 *
 * What that costs is a press. The start menu's open path skips `super.load`
 * while `parent` is set, appends nothing, notices at the end that it is not
 * connected, and closes itself — which clears the pointer, so the *next* press
 * works. That is the bug this desktop has now had three times, and it is why it
 * has always looked like "one press does nothing, the second one is fine".
 *
 * These cases are written against the fault rather than the fix: they say what
 * a component and a menu should do when the DOM has been changed underneath
 * them, which is the thing no version of the state machine above has said.
 */

let host: HTMLElement

class Thing extends OSElement {
  constructor() {
    super('div', 'thing')
    this.style = () => ({ [this.id]: { color: 'red' } })
  }
}

const makeDesktop = () => {
  const root = document.createElement('div')
  const taskbar = document.createElement('div')
  document.body.appendChild(root)
  return {
    getElement: () => root,
    getTaskbar: () => ({ getElement: () => taskbar }),
    launcher: { toggle: vi.fn().mockResolvedValue(undefined) },
  } as any
}

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(async () => {
  for (const open of windowManager.list()) windowManager.remove(open.window)
  host.remove()
})

describe('a component whose element was taken out from under it', () => {
  it('does not claim to be mounted when it is not in the document', async () => {
    const thing = new Thing()
    await thing.load(host)
    expect(thing.mounted).toBe(true)

    // Removed by something that never asked — a host rebuilding its children,
    // a parent replacing its contents. The component is not told.
    thing.element.remove()

    expect(thing.mounted, 'still claims to be on screen').toBe(false)
  })

  it('can be put back on screen', async () => {
    const thing = new Thing()
    await thing.load(host)
    thing.element.remove()

    await thing.load(host)

    expect(thing.element.isConnected, 'never came back').toBe(true)
    expect(host.contains(thing.element)).toBe(true)
  })
})

describe('the start menu, after its element was detached behind its back', () => {
  /*
   * The button calls `toggle`, so what a press means is decided by what the
   * board believes about itself. Believing it is up while the document has
   * already dropped it, a press to *open* is read as a press to close — and
   * spends itself tidying away something that was not on screen.
   *
   * From the other side of it: the menu is not showing, you press the button,
   * nothing happens.
   */
  it('opens on the press that is meant to open it', async () => {
    const menu = new StartMenu(makeDesktop())
    const anchor = document.createElement('button')

    await menu.toggle(host, anchor)
    expect(host.querySelector('.start-menu'), 'never opened at all').toBeTruthy()

    // Removed by something that never told it: the board still believes it is up.
    menu.getElement().remove()
    expect(host.querySelector('.start-menu')).toBeNull()

    // Somebody presses the start button, wanting the menu.
    await menu.toggle(host, anchor)

    expect(
      host.querySelector('.start-menu'),
      'the press was eaten closing something that was not there',
    ).toBeTruthy()
    await menu.close()
  })

  /*
   * Stated separately because it is the symptom that gets reported, and the one
   * that makes this look intermittent rather than broken: the second press
   * works, so the desktop reads as merely flaky.
   */
  it('does not need a second press to come back', async () => {
    const menu = new StartMenu(makeDesktop())
    const anchor = document.createElement('button')
    await menu.toggle(host, anchor)
    menu.getElement().remove()

    await menu.toggle(host, anchor)
    const first = !!host.querySelector('.start-menu')
    await menu.toggle(host, anchor)
    const second = !!host.querySelector('.start-menu')

    expect({ first, second }).toEqual({ first: true, second: false })
  })
})
