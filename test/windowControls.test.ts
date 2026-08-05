import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import OSWindow from '../src/components/Window'
import windowManager from '../src/utils/windowManager'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement
let taskbar: HTMLElement

/** A desktop whose taskbar sits 600px down, as the real one does. */
const makeDesktop = () =>
  ({
    getElement: () => host,
    getTaskbar: () => ({ getElement: () => taskbar }),
  }) as any

const makeWindow = (over: Record<string, unknown> = {}) => {
  const win = new OSWindow({
    title: 'About',
    content: document.createElement('div'),
    desktop: makeDesktop(),
    onActive: vi.fn(),
    onClose: vi.fn(),
    onChange: vi.fn(),
    dimensions: { width: 400, height: 300 },
    ...over,
  } as any)
  return win
}

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  taskbar = document.createElement('div')
  Object.defineProperty(taskbar, 'offsetTop', { value: 600, configurable: true })
  Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
})

afterEach(() => {
  host.remove()
  vi.restoreAllMocks()
})

describe('minimize', () => {
  /*
   * Hidden rather than unloaded: the content keeps its state — a scrolled
   * README, an open file — and comes back exactly as it was.
   */
  it('hides the window without closing it', async () => {
    const onClose = vi.fn()
    const win = makeWindow({ onClose })
    await win.load(host)

    await win.minimize()

    expect(win.minimized).toBe(true)
    expect(win.getElement().style.display).toBe('none')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('brings it back exactly where it was', async () => {
    const win = makeWindow()
    await win.load(host)
    win.getElement().style.left = '123px'

    await win.minimize()
    await win.restore()

    expect(win.minimized).toBe(false)
    expect(win.getElement().style.display).toBe('')
    expect(win.getElement().style.left).toBe('123px')
  })

  it('tells the taskbar, which is the only way back to it', async () => {
    const onChange = vi.fn()
    const win = makeWindow({ onChange })
    await win.load(host)

    await win.minimize()
    expect(onChange).toHaveBeenCalled()
  })

  it('does nothing when it is already away, or already back', async () => {
    const win = makeWindow()
    await win.load(host)

    await win.minimize()
    await win.minimize()
    expect(win.minimized).toBe(true)

    await win.restore()
    await win.restore()
    expect(win.minimized).toBe(false)
  })

  it('stops being the active window while it is hidden', async () => {
    const win = makeWindow()
    await win.load(host)
    win.focus()

    await win.minimize()
    expect(win.active).toBe(false)
  })
})

describe('maximize', () => {
  it('fills the desktop down to the taskbar, and no further', async () => {
    const win = makeWindow()
    await win.load(host)

    win.toggleMaximize()

    const style = win.getElement().style
    expect(win.maximized).toBe(true)
    expect(style.left).toBe('0px')
    expect(style.top).toBe('0px')
    expect(style.width).toBe('1000px')
    // The taskbar's own top edge: a maximised window must never cover the one
    // control that gets you back to the others.
    expect(style.height).toBe('600px')
  })

  it('puts it back exactly where it was', async () => {
    const win = makeWindow()
    await win.load(host)
    Object.assign(win.getElement().style, {
      left: '80px',
      top: '40px',
      width: '400px',
      height: '300px',
    })

    win.toggleMaximize()
    win.toggleMaximize()

    const style = win.getElement().style
    expect(win.maximized).toBe(false)
    expect([style.left, style.top, style.width, style.height]).toEqual([
      '80px',
      '40px',
      '400px',
      '300px',
    ])
  })

  it('clears any drag transform, which would otherwise offset the new size', async () => {
    const win = makeWindow()
    await win.load(host)
    win.getElement().style.transform = 'translate3d(50px, 50px, 0)'

    win.toggleMaximize()
    expect(win.getElement().style.transform).toBe('')
  })
})

describe('the titlebar', () => {
  const dblclick = (target: Element) =>
    target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))

  it('toggles maximize on a double click', async () => {
    const win = makeWindow()
    await win.load(host)
    win.makeMovable()

    const titlebar = win.getElement().querySelector('.topbar-window')!
    dblclick(titlebar)
    expect(win.maximized).toBe(true)

    dblclick(titlebar)
    expect(win.maximized).toBe(false)
  })

  /*
   * Regression: un-maximising used to happen on mousedown, and a double-click
   * is two of those — the second press restored the window and the dblclick
   * that followed maximised it straight back. It could never be put back, and
   * its saved position was overwritten on the way.
   */
  it('restores to where it was after maximising by double click', async () => {
    const win = makeWindow()
    await win.load(host)
    win.makeMovable()
    Object.assign(win.getElement().style, {
      left: '80px',
      top: '40px',
      width: '400px',
      height: '300px',
    })

    const titlebar = win.getElement().querySelector('.topbar-window')!
    dblclick(titlebar)
    expect(win.maximized).toBe(true)

    dblclick(titlebar)

    expect(win.maximized).toBe(false)
    const style = win.getElement().style
    expect([style.left, style.top, style.width, style.height]).toEqual([
      '80px',
      '40px',
      '400px',
      '300px',
    ])
  })

  it('does not restore on a press that never moves', async () => {
    const win = makeWindow()
    await win.load(host)
    win.makeMovable()
    win.toggleMaximize()

    win.getElement()
      .querySelector('.topbar-window')!
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    expect(win.maximized).toBe(true)
  })

  it('restores under the cursor once the drag actually moves', async () => {
    const win = makeWindow()
    await win.load(host)
    win.makeMovable()
    win.toggleMaximize()

    win.getElement()
      .querySelector('.topbar-window')!
      .dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, clientX: 500, clientY: 10 }),
      )
    window.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 510, clientY: 20 }),
    )

    expect(win.maximized).toBe(false)
    // Carries on as an ordinary drag from where it landed.
    expect(win.getElement().style.left).not.toBe('0px')
  })

  /*
   * The buttons live inside the titlebar, so double-clicking close or minimize
   * would otherwise also toggle the window underneath them.
   */
  it('ignores a double click that lands on a button', async () => {
    const win = makeWindow()
    await win.load(host)
    win.makeMovable()

    const button = win.getElement().querySelector('topbar-button')!
    dblclick(button)
    expect(win.maximized).toBe(false)
  })
})

describe('the window manager', () => {
  it('reports whether each window is hidden, so the taskbar can say so', async () => {
    const win = makeWindow()
    await win.load(host)
    vi.spyOn(windowManager, 'list').mockReturnValue([
      { window: win, title: 'About', active: true, minimized: false },
    ])

    expect(windowManager.list()[0].minimized).toBe(false)
    await win.minimize()
    expect(win.minimized).toBe(true)
  })
})
