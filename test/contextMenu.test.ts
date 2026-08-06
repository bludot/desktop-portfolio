import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import contextMenu, {
  ContextMenu,
  bindContextMenu,
  placeMenu,
} from '../src/components/ContextMenu'
import {
  desktopMenuItems,
  windowMenuItems,
} from '../src/components/ContextMenu/menus'
import OSWindow from '../src/components/Window'
import Desktop from '../src/components/Desktop'

jss.setup(preset())
jss.use(nested())

const viewport = { width: 1200, height: 800 }

describe('placeMenu', () => {
  it('opens down and to the right of the pointer', () => {
    const { left, top } = placeMenu({ x: 300, y: 200 }, { width: 200, height: 160 }, viewport)
    expect(left).toBe(300)
    expect(top).toBe(200)
  })

  /*
   * Flipped rather than nudged. Sliding it back onto the screen would leave the
   * menu under the pointer, so whichever item landed there would be armed the
   * instant it appeared.
   */
  it('flips left rather than sliding back onto the screen', () => {
    const { left } = placeMenu({ x: 1150, y: 200 }, { width: 200, height: 160 }, viewport)
    expect(left).toBe(950)
  })

  it('flips up when there is no room below', () => {
    const { top } = placeMenu({ x: 300, y: 780 }, { width: 200, height: 160 }, viewport)
    expect(top).toBe(620)
  })

  it('flips both ways in the bottom right corner', () => {
    const { left, top } = placeMenu({ x: 1190, y: 790 }, { width: 200, height: 160 }, viewport)
    expect(left).toBe(990)
    expect(top).toBe(630)
  })

  // The scale should look like growth from the pointer, which means growing
  // from whichever corner the menu was actually placed by.
  it('reports the corner it grew from', () => {
    expect(placeMenu({ x: 10, y: 10 }, { width: 200, height: 160 }, viewport).origin)
      .toBe('left top')
    expect(placeMenu({ x: 1190, y: 790 }, { width: 200, height: 160 }, viewport).origin)
      .toBe('right bottom')
  })

  // Flipping cannot help a menu taller than the screen, so it is clamped and
  // the margin is still honoured.
  it('clamps a menu that fits neither way', () => {
    const { top } = placeMenu({ x: 300, y: 400 }, { width: 200, height: 900 }, viewport)
    expect(top).toBe(8)
  })

  it('keeps a margin from every edge', () => {
    const { left, top } = placeMenu({ x: 0, y: 0 }, { width: 200, height: 160 }, viewport)
    expect(left).toBe(8)
    expect(top).toBe(8)
  })
})

describe('windowMenuItems', () => {
  const actions = {
    show: vi.fn(),
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    closeOthers: vi.fn(),
  }

  const labels = (items: { label: string }[]) => items.map((i) => i.label)

  it('offers to hide a window that is on screen', () => {
    const items = windowMenuItems({ minimized: false, maximized: false, others: 0 }, actions)
    expect(labels(items)[0]).toBe('Minimize')
  })

  it('offers to bring back a window that is not', () => {
    const items = windowMenuItems({ minimized: true, maximized: false, others: 0 }, actions)
    expect(labels(items)[0]).toBe('Show')
  })

  it('names the maximize item for what it will do', () => {
    expect(labels(windowMenuItems({ minimized: false, maximized: false, others: 0 }, actions))[1])
      .toBe('Maximize')
    expect(labels(windowMenuItems({ minimized: false, maximized: true, others: 0 }, actions))[1])
      .toBe('Restore')
  })

  // There is nothing to fill or to put back while the window is off screen.
  it('cannot maximize a minimized window', () => {
    const items = windowMenuItems({ minimized: true, maximized: false, others: 0 }, actions)
    expect(items[1].disabled).toBe(true)
  })

  /*
   * Disabled, not removed. A menu whose length changes with the state of the
   * window teaches you nothing, because you never see the same menu twice.
   */
  it('keeps close-others in the menu when it is the only window', () => {
    const items = windowMenuItems({ minimized: false, maximized: false, others: 0 }, actions)
    expect(labels(items)).toContain('Close other windows')
    expect(items[3].disabled).toBe(true)
  })

  it('says how many others there are', () => {
    expect(labels(windowMenuItems({ minimized: false, maximized: false, others: 1 }, actions))[3])
      .toBe('Close other window')
    expect(labels(windowMenuItems({ minimized: false, maximized: false, others: 2 }, actions))[3])
      .toBe('Close other windows')
  })
})

describe('desktopMenuItems', () => {
  const actions = {
    toggleTheme: vi.fn(),
    showAll: vi.fn(),
    minimizeAll: vi.fn(),
    settings: vi.fn(),
  }

  it('ticks dark mode only when dark mode is on', () => {
    expect(desktopMenuItems({ dark: true, open: 0, onScreen: 0 }, actions)[0].checked).toBe(true)
    expect(desktopMenuItems({ dark: false, open: 0, onScreen: 0 }, actions)[0].checked).toBe(false)
  })

  it('cannot show or minimize windows that are not there', () => {
    const items = desktopMenuItems({ dark: false, open: 0, onScreen: 0 }, actions)
    expect(items[1].disabled).toBe(true)
    expect(items[2].disabled).toBe(true)
  })

  // Every window is open but hidden: there is still something to show, but
  // nothing left to put away.
  it('can show minimized windows but not minimize them again', () => {
    const items = desktopMenuItems({ dark: false, open: 2, onScreen: 0 }, actions)
    expect(items[1].disabled).toBeFalsy()
    expect(items[2].disabled).toBe(true)
  })

  it('always offers settings', () => {
    const items = desktopMenuItems({ dark: false, open: 0, onScreen: 0 }, actions)
    expect(items.map((i) => i.label)).toContain('Settings…')
  })
})

describe('ContextMenu', () => {
  let host: HTMLElement
  let menu: ContextMenu

  beforeEach(async () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    menu = new ContextMenu()
    await menu.load(host)
  })

  afterEach(async () => {
    menu.close()
    await menu.unload()
    host.remove()
  })

  it('draws an item per entry, with the dividers between them', async () => {
    await menu.show({ x: 10, y: 10 }, [
      { label: 'Minimize' },
      { label: 'Close', separated: true },
    ])
    expect(menu.getElement().querySelectorAll('.menu-item')).toHaveLength(2)
    expect(menu.getElement().querySelectorAll('.menu-divider')).toHaveLength(1)
  })

  // A divider before the first item would be a line against the panel's edge.
  it('never opens with a divider', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Close', separated: true }])
    expect(menu.getElement().querySelectorAll('.menu-divider')).toHaveLength(0)
  })

  it('runs the action and closes', async () => {
    const onPress = vi.fn()
    await menu.show({ x: 10, y: 10 }, [{ label: 'Close', onPress }])
    menu.getElement().querySelector<HTMLButtonElement>('.menu-item')!.click()
    expect(onPress).toHaveBeenCalledOnce()
    expect(menu.isOpen()).toBe(false)
  })

  it('ignores a disabled item', async () => {
    const onPress = vi.fn()
    await menu.show({ x: 10, y: 10 }, [{ label: 'Close others', onPress, disabled: true }])
    const item = menu.getElement().querySelector<HTMLButtonElement>('.menu-item')!
    item.click()
    expect(onPress).not.toHaveBeenCalled()
    expect(item.getAttribute('aria-disabled')).toBe('true')
    expect(menu.isOpen()).toBe(true)
  })

  it('marks a checked item for a screen reader as well as for the eye', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Dark mode', checked: true }])
    const item = menu.getElement().querySelector('.menu-item')!
    expect(item.getAttribute('role')).toBe('menuitemcheckbox')
    expect(item.getAttribute('aria-checked')).toBe('true')
    expect(item.querySelector('.menu-tick svg')).toBeTruthy()
  })

  it('closes on Escape', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Close' }])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(menu.isOpen()).toBe(false)
  })

  it('closes on a press outside, and stays open on a press inside', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Close' }])

    const item = menu.getElement().querySelector<HTMLElement>('.menu-item')!
    item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(menu.isOpen()).toBe(true)

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(menu.isOpen()).toBe(false)
  })

  /*
   * A selection scrolling away from its menu, or a window moving out from
   * under it, leaves the menu pointing at nothing.
   */
  it('closes when the page moves under it', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Close' }])
    window.dispatchEvent(new Event('resize'))
    expect(menu.isOpen()).toBe(false)
  })

  /*
   * Nothing is focused when a menu opens under the pointer — that is a mouse
   * gesture, and pre-selecting would arm whatever the first item happens to be.
   * The first arrow key is what turns it into a keyboard menu.
   */
  it('focuses nothing until an arrow key is pressed', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Minimize' }, { label: 'Close' }])
    const items = menu.getElement().querySelectorAll<HTMLElement>('.menu-item')
    expect(document.activeElement).not.toBe(items[0])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(document.activeElement).toBe(items[0])
  })

  it('wraps at both ends', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Minimize' }, { label: 'Close' }])
    const items = menu.getElement().querySelectorAll<HTMLElement>('.menu-item')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(document.activeElement).toBe(items[1])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(document.activeElement).toBe(items[0])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(document.activeElement).toBe(items[1])
  })

  // Disabled items are drawn but never landed on by the keyboard.
  it('steps over disabled items', async () => {
    await menu.show({ x: 10, y: 10 }, [
      { label: 'Minimize' },
      { label: 'Maximize', disabled: true },
      { label: 'Close' },
    ])
    const items = menu.getElement().querySelectorAll<HTMLElement>('.menu-item')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(document.activeElement).toBe(items[2])
  })

  /*
   * The dismissal handlers sit on window in capture, so a closed menu that had
   * not let go of them would keep answering keys and presses aimed at the
   * desktop for the rest of the session.
   */
  it('stops listening once it is closed', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Minimize' }, { label: 'Close' }])
    menu.close()

    const elsewhere = document.createElement('button')
    document.body.appendChild(elsewhere)
    elsewhere.focus()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(document.activeElement).toBe(elsewhere)
    elsewhere.remove()
  })

  it('replaces its contents rather than accumulating them', async () => {
    await menu.show({ x: 10, y: 10 }, [{ label: 'Minimize' }, { label: 'Close' }])
    await menu.show({ x: 10, y: 10 }, [{ label: 'Settings…' }])
    expect(menu.getElement().querySelectorAll('.menu-item')).toHaveLength(1)
  })
})

/*
 * The menu is only as good as what it is told about the window, and that is
 * read live at the moment of the press. These check the reading, not the panel.
 */
describe('a window through its own menu', () => {
  let host: HTMLElement
  let taskbar: HTMLElement

  const makeWindow = (over: Record<string, unknown> = {}) =>
    new OSWindow({
      title: 'About',
      content: document.createElement('div'),
      desktop: {
        getElement: () => host,
        getTaskbar: () => ({ getElement: () => taskbar }),
      },
      onActive: vi.fn(),
      onClose: vi.fn(),
      onChange: vi.fn(),
      dimensions: { width: 400, height: 300 },
      ...over,
    } as any)

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
    taskbar = document.createElement('div')
    Object.defineProperty(taskbar, 'offsetTop', { value: 600, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
  })

  afterEach(() => {
    host.remove()
  })

  it('follows the window as it is minimized and maximized', async () => {
    const win = makeWindow()
    await win.load(host)

    expect(win.menuItems().map((i) => i.label)).toEqual([
      'Minimize',
      'Maximize',
      'Close',
      'Close other windows',
    ])

    win.toggleMaximize()
    expect(win.menuItems()[1].label).toBe('Restore')

    await win.minimize()
    expect(win.menuItems()[0].label).toBe('Show')
  })

  // A snapshot taken at construction would tell the first window ever opened
  // that it is still the only one, forever.
  it('counts the other windows at the moment it is asked', async () => {
    const others: any[] = []
    const win = makeWindow({ peers: () => [win, ...others] })
    await win.load(host)

    expect(win.menuItems()[3].disabled).toBe(true)

    others.push(makeWindow())
    expect(win.menuItems()[3].disabled).toBeFalsy()
    expect(win.menuItems()[3].label).toBe('Close other window')
  })

  it('closes the others and not itself', async () => {
    const onClose = vi.fn()
    const other = makeWindow({ onClose })
    const win = makeWindow({ peers: () => [win, other] })
    await win.load(host)
    await other.load(host)

    await win.menuItems()[3].onPress!(new MouseEvent('click'))
    // The exit animation resolves on its own frame.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(onClose).toHaveBeenCalledWith(other)
  })

  /*
   * The whole window, titlebar and content alike: a right-click should always
   * land on something, and inside a window the honest answer is the window.
   */
  it('offers the menu anywhere in the window', async () => {
    const content = document.createElement('div')
    content.className = 'the-content'
    const win = makeWindow({ content })
    await win.load(host)

    const titlebar = win.getElement().querySelector('.topbar-window')!
    expect(titlebar.contains(content)).toBe(false)

    const onTitlebar = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    titlebar.dispatchEvent(onTitlebar)
    expect(onTitlebar.defaultPrevented).toBe(true)
    contextMenu.close()

    const inContent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    content.dispatchEvent(inContent)
    expect(inContent.defaultPrevented).toBe(true)
  })

  // Cut, paste and spelling are things only the browser can offer, so a text
  // field is the one place its own menu is worth more than ours.
  it('leaves a text field to the browser', async () => {
    const content = document.createElement('div')
    const field = document.createElement('input')
    content.appendChild(field)
    const win = makeWindow({ content })
    await win.load(host)

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    field.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})

/*
 * A right-click should always land on something. Surfaces that answer one stop
 * it there; everything else falls through to the desktop, so the browser's own
 * menu never turns up in the middle of a desktop.
 */
describe('the menu under everything', () => {
  let host: HTMLElement
  let desktop: Desktop

  beforeEach(async () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    desktop = new Desktop({ backgroundColor: '#fff', mainElement: host })
    await desktop.startup({ unload: vi.fn().mockResolvedValue(undefined) } as any)
  })

  afterEach(async () => {
    contextMenu.close()
    await desktop.unload()
    // The menu is one instance for the whole desktop, so it has to be handed
    // back before the next desktop mounts its own copy.
    if (contextMenu.parent) await contextMenu.unload()
    host.remove()
  })

  const rightClickOn = (el: Element) => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    el.dispatchEvent(event)
    return event
  }

  it('answers a press on something with no menu of its own', () => {
    const stray = document.createElement('div')
    document.body.appendChild(stray)

    expect(rightClickOn(stray).defaultPrevented).toBe(true)
    expect(contextMenu.getElement().textContent).toContain('Dark mode')

    stray.remove()
  })

  it('still answers a press on the wallpaper itself', () => {
    expect(rightClickOn(desktop.getElement()).defaultPrevented).toBe(true)
  })

  it('leaves text fields to the browser wherever they are', () => {
    const field = document.createElement('textarea')
    document.body.appendChild(field)

    expect(rightClickOn(field).defaultPrevented).toBe(false)

    field.remove()
  })

  it('stops answering once the desktop is gone', async () => {
    const stray = document.createElement('div')
    document.body.appendChild(stray)

    await desktop.unload()
    expect(rightClickOn(stray).defaultPrevented).toBe(false)

    stray.remove()
  })
})

describe('bindContextMenu', () => {
  let target: HTMLElement

  beforeEach(() => {
    target = document.createElement('div')
    document.body.appendChild(target)
  })

  afterEach(() => {
    contextMenu.close()
    target.remove()
  })

  const rightClick = () => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    target.dispatchEvent(event)
    return event
  }

  /*
   * Returning items is what claims the gesture. An empty list leaves the
   * browser's own menu alone, so right-clicking a link or a paragraph still
   * does what it does everywhere else.
   */
  it('leaves the native menu alone when there is nothing to offer', () => {
    bindContextMenu(target, () => [])
    expect(rightClick().defaultPrevented).toBe(false)
  })

  it('takes over the gesture when there is', () => {
    bindContextMenu(target, () => [{ label: 'Close' }])
    expect(rightClick().defaultPrevented).toBe(true)
  })

  // Built at the moment of the press, so a menu always describes the window as
  // it is now rather than as it was when the handler was attached.
  it('asks for the items on every press', () => {
    const build = vi.fn(() => [{ label: 'Close' }])
    bindContextMenu(target, build)
    rightClick()
    rightClick()
    expect(build).toHaveBeenCalledTimes(2)
  })

  it('stops offering a menu once it is unbound', () => {
    const unbind = bindContextMenu(target, () => [{ label: 'Close' }])
    unbind()
    expect(rightClick().defaultPrevented).toBe(false)
  })
})
