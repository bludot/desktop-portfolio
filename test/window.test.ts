import { describe, it, expect, beforeEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import OSWindow from '../src/components/Window'
import db from '../src/Store'

jss.setup(preset())
jss.use(nested())

const makeDesktop = () => {
  const root = document.createElement('div')
  const taskbar = document.createElement('div')
  document.body.appendChild(root)
  return {
    getElement: () => root,
    getTaskbar: () => ({ getElement: () => taskbar }),
  } as any
}

const makeWindow = (overrides = {}) =>
  new OSWindow({
    title: 'About',
    content: document.createElement('p'),
    desktop: makeDesktop(),
    onActive: vi.fn(),
    onClose: vi.fn(),
    center: false,
    dimensions: { width: 400, height: 300 },
    windowPosition: { top: 30, left: 30 },
    ...overrides,
  } as any)

const mouse = (type: string, x: number, y: number) =>
  new MouseEvent(type, { bubbles: true, clientX: x, clientY: y })

describe('OSWindow', () => {
  beforeEach(async () => {
    await db.featureFlags.clear()
  })

  it('exposes the supplied title and dimensions', () => {
    const win = makeWindow()
    expect(win.title).toBe('About')
    expect(win.dimensions).toEqual({ width: 400, height: 300 })
  })

  it('starts focused and toggles the active flag', () => {
    const win = makeWindow()
    expect(win.active).toBe(true)
    win.unfocus()
    expect(win.active).toBe(false)
    win.focus()
    expect(win.active).toBe(true)
  })

  it('setIndex writes the z-index', () => {
    const win = makeWindow()
    win.setIndex(4)
    expect(win.getElement().style.zIndex).toBe('4')
  })

  it('loads its content and topbar into the desktop', async () => {
    const win = makeWindow()
    await win.load(null)
    expect(win.getElement().querySelector('.topbar-window')).toBeTruthy()
    expect(win.parent).toBeTruthy()
  })

  it('notifies onActive when the window is pressed', () => {
    const onActive = vi.fn()
    const win = makeWindow({ onActive })
    win.mousedownWindow()
    expect(onActive).toHaveBeenCalledWith(win)
  })

  describe('dragging', () => {
    // Regression: mouseup used to pass this.mousemove.bind(this) to
    // removeEventListener. .bind() returns a fresh function every call, so the
    // listener registered on mousedown was never removed and each drag leaked a
    // handler that stayed live for the lifetime of the page.
    it('removes both window listeners when the drag ends', async () => {
      const win = makeWindow()
      await win.load(null)
      win.makeMovable()

      const added: unknown[] = []
      const removed: unknown[] = []
      const addSpy = vi
        .spyOn(window, 'addEventListener')
        .mockImplementation(((t: string, f: unknown) => {
          if (t === 'mousemove' || t === 'mouseup') added.push(f)
        }) as any)
      const removeSpy = vi
        .spyOn(window, 'removeEventListener')
        .mockImplementation(((t: string, f: unknown) => {
          if (t === 'mousemove' || t === 'mouseup') removed.push(f)
        }) as any)

      win.mousedown(mouse('mousedown', 200, 50) as MouseEvent)
      win.mouseup(mouse('mouseup', 300, 150) as MouseEvent)

      addSpy.mockRestore()
      removeSpy.mockRestore()

      expect(added).toHaveLength(2)
      expect(removed).toHaveLength(2)
      // The identities must match, or removeEventListener is a no-op.
      expect(new Set(removed)).toEqual(new Set(added))
    })

    it('leaves no live mousemove handler after repeated drags', async () => {
      const win = makeWindow()
      await win.load(null)
      win.makeMovable()

      const live = new Set<unknown>()
      const addSpy = vi
        .spyOn(window, 'addEventListener')
        .mockImplementation(((t: string, f: unknown) => {
          if (t === 'mousemove') live.add(f)
        }) as any)
      const removeSpy = vi
        .spyOn(window, 'removeEventListener')
        .mockImplementation(((t: string, f: unknown) => {
          if (t === 'mousemove') live.delete(f)
        }) as any)

      for (let i = 0; i < 5; i++) {
        win.mousedown(mouse('mousedown', 200, 50) as MouseEvent)
        win.mouseup(mouse('mouseup', 300, 150) as MouseEvent)
      }

      addSpy.mockRestore()
      removeSpy.mockRestore()
      expect(live.size).toBe(0)
    })

    it('binds each handler once, so makeMovable is idempotent', async () => {
      const win = makeWindow()
      await win.load(null)
      const titlebar = win.getElement().querySelector('.topbar-window')
      const spy = vi.spyOn(titlebar, 'addEventListener')

      win.makeMovable()
      win.makeMovable()

      const handlers = spy.mock.calls
        .filter(([type]) => type === 'mousedown')
        .map(([, fn]) => fn)
      expect(handlers).toHaveLength(2)
      // Same reference both times, so the browser de-duplicates the listener.
      expect(handlers[0]).toBe(handlers[1])
    })

    it('moves the element while dragging', async () => {
      const win = makeWindow()
      await win.load(null)
      win.makeMovable()

      win.mousedown(mouse('mousedown', 200, 50) as MouseEvent)
      win.mousemove(mouse('mousemove', 500, 300) as MouseEvent)

      expect(win.getElement().style.left).not.toBe('')
      expect(win.getElement().style.top).not.toBe('')
      expect(win.getElement().style.left).not.toContain('NaN')
      expect(win.getElement().style.top).not.toContain('NaN')
    })

    it('clears the drag origin on mouseup', () => {
      const win = makeWindow()
      win.mousedown(mouse('mousedown', 200, 50) as MouseEvent)
      expect(win.windowPosition).toHaveProperty('x')
      win.mouseup(mouse('mouseup', 200, 50) as MouseEvent)
      expect(win.windowPosition).toEqual({})
    })
  })

  describe('custom scrollbar feature flag', () => {
    // The scrollbar is only considered for content that loads itself; a raw
    // node is appended directly and skips the flag check entirely.
    const loadableContent = () => ({ load: vi.fn().mockResolvedValue(undefined) })

    it('is left off when the flag is absent', async () => {
      const win = makeWindow({ content: loadableContent() })
      const scrollbarLoad = vi.spyOn((win as any).scrollbar, 'load')
      await win.load(null)
      expect(scrollbarLoad).not.toHaveBeenCalled()
    })

    it('is left off when the flag exists but is disabled', async () => {
      await db.featureFlags.add({
        code: 'custom_scrollbar',
        name: 'custom scrollbar',
        enabled: false,
      } as any)

      const win = makeWindow({ content: loadableContent() })
      const scrollbarLoad = vi.spyOn((win as any).scrollbar, 'load')
      await win.load(null)
      expect(scrollbarLoad).not.toHaveBeenCalled()
    })

    it('is attached when the flag is enabled', async () => {
      await db.featureFlags.add({
        code: 'custom_scrollbar',
        name: 'custom scrollbar',
        enabled: true,
      } as any)

      const win = makeWindow({ content: loadableContent() })
      const scrollbarLoad = vi
        .spyOn((win as any).scrollbar, 'load')
        .mockResolvedValue(undefined as any)
      await win.load(null)
      expect(scrollbarLoad).toHaveBeenCalled()
    })
  })

  it('appends raw nodes when the content has no load method', async () => {
    const content = document.createElement('p')
    content.textContent = 'plain'
    const win = makeWindow({ content })
    await win.load(null)
    expect(win.getElement().textContent).toContain('plain')
  })
})
