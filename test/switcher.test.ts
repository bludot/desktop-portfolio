import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import Switcher, { columnsFor, layoutCells } from '../src/components/Switcher'
import windowManager from '../src/utils/windowManager'
import { NARROW_PX } from '../src/utils/utils'

jss.setup(preset())
jss.use(nested())

const DESKTOP = { width: 1600, height: 900 }
const PHONE = { width: 390, height: 780 }

describe('columnsFor', () => {
  it('keeps a single window to one column', () => {
    expect(columnsFor(0, false)).toBe(1)
    expect(columnsFor(1, false)).toBe(1)
  })

  it('grows a square-ish grid on a desktop', () => {
    expect(columnsFor(2, false)).toBe(2)
    expect(columnsFor(4, false)).toBe(2)
    expect(columnsFor(5, false)).toBe(3)
    expect(columnsFor(9, false)).toBe(3)
  })

  // Cards, not a mosaic: three across on a phone is unreadable.
  it('never goes past two columns on a phone', () => {
    for (let n = 1; n <= 12; n++) {
      expect(columnsFor(n, true)).toBeLessThanOrEqual(2)
    }
    expect(columnsFor(2, true)).toBe(1)
    expect(columnsFor(3, true)).toBe(2)
  })
})

describe('layoutCells', () => {
  const overlaps = (
    a: { left: number; top: number; width: number; height: number },
    b: { left: number; top: number; width: number; height: number },
  ) =>
    a.left < b.left + b.width &&
    b.left < a.left + a.width &&
    a.top < b.top + b.height &&
    b.top < a.top + a.height

  it('returns one cell per window and never overlaps them', () => {
    for (const count of [1, 2, 3, 5, 8]) {
      const { cells } = layoutCells(count, DESKTOP)
      expect(cells).toHaveLength(count)
      cells.forEach((a, i) =>
        cells.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)),
      )
    }
  })

  // Regression: cells sized purely by dividing the screen were big enough that
  // every window fitted at full size, so opening the overview looked like
  // nothing had happened except the desktop going dark.
  it('caps a desktop tile so windows have to shrink into it', () => {
    const { cells } = layoutCells(2, DESKTOP)
    cells.forEach((cell) => {
      expect(cell.width).toBeLessThanOrEqual(480)
      expect(cell.height).toBeLessThanOrEqual(380)
    })
  })

  it('centres the grid rather than anchoring it to a corner', () => {
    const { cells } = layoutCells(2, DESKTOP)
    const left = Math.min(...cells.map((c) => c.left))
    const right = Math.max(...cells.map((c) => c.left + c.width))
    expect(left).toBeCloseTo(DESKTOP.width - right, 0)
  })

  it('gives a phone the full width for its cards', () => {
    const { cells } = layoutCells(1, PHONE)
    expect(cells[0].width).toBeGreaterThan(PHONE.width * 0.7)
  })

  // Four cards fill a phone's two rows; a fifth has to go somewhere.
  it('fits up to four cards on a phone without scrolling', () => {
    for (const count of [1, 2, 3, 4]) {
      const { contentHeight } = layoutCells(count, PHONE)
      expect(contentHeight).toBeLessThanOrEqual(PHONE.height)
    }
  })

  it('scrolls past four cards instead of shrinking them further', () => {
    const four = layoutCells(4, PHONE)
    const six = layoutCells(6, PHONE)

    expect(six.contentHeight).toBeGreaterThan(PHONE.height)
    // The extra row is added below, not taken out of the existing cards.
    expect(six.cells[0].height).toBeCloseTo(four.cells[0].height, 5)
  })

  // The breakpoint is inclusive, so a viewport exactly on it gets the phone
  // layout. Counted by where the grid wraps: two across, not three.
  it('treats the breakpoint itself as narrow', () => {
    const columnsIn = (cells: { top: number }[]) =>
      cells.filter((c) => c.top === cells[0].top).length

    expect(columnsIn(layoutCells(5, { width: NARROW_PX, height: 800 }).cells)).toBe(2)
    expect(
      columnsIn(layoutCells(5, { width: NARROW_PX + 1, height: 800 }).cells),
    ).toBe(3)
  })
})

describe('Switcher', () => {
  let host: HTMLElement
  let desktop: HTMLElement
  let windows: HTMLElement[]

  const makeWindow = (title: string) => {
    const el = document.createElement('window')
    desktop.appendChild(el)
    windows.push(el)
    return {
      window: { getElement: () => el, onActive: vi.fn(), title } as any,
      title,
      active: false,
      minimized: false,
    }
  }

  const build = () =>
    new Switcher({ taskbarHeight: () => 50, scrimHost: () => desktop })

  beforeEach(() => {
    host = document.createElement('div')
    host.id = 'app'
    desktop = document.createElement('desktop')
    document.body.append(host, desktop)
    windows = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    host.remove()
    desktop.remove()
  })

  it('opens with a tile per window, labelled', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([
      makeWindow('About'),
      makeWindow('Experience'),
    ])

    const switcher = build()
    await switcher.show(host)

    const tiles = [...host.querySelectorAll('.switcher-tile')]
    expect(tiles).toHaveLength(2)
    expect(tiles.map((t) => t.textContent)).toEqual(['About', 'Experience'])
    expect(switcher.isOpen()).toBe(true)
  })

  /*
   * Regression: below 760px the taskbar hides its chips, leaving the overview
   * as the only way back to a window — and the overview filtered out exactly
   * the windows that needed it. Minimising on a phone lost the window for good.
   */
  describe('a minimised window', () => {
    const makeMinimized = (title: string) => {
      const open = makeWindow(title)
      open.minimized = true
      open.window.minimized = true
      open.window.getElement().style.display = 'none'
      open.window.restore = vi.fn(async () => {
        open.window.minimized = false
        open.window.getElement().style.display = ''
      })
      return open
    }

    it('still gets a tile', async () => {
      const hidden = makeMinimized('About')
      vi.spyOn(windowManager, 'list').mockReturnValue([hidden, makeWindow('Experience')])

      const switcher = build()
      await switcher.show(host)

      const tiles = [...host.querySelectorAll('.switcher-tile')]
      expect(tiles.map((t) => t.textContent)).toEqual(['About', 'Experience'])
      // Shown while the overview is open, or its tile would measure nothing.
      expect(hidden.window.getElement().style.display).toBe('')
    })

    it('is restored when it is the one picked', async () => {
      const hidden = makeMinimized('About')
      vi.spyOn(windowManager, 'list').mockReturnValue([hidden])

      const switcher = build()
      await switcher.show(host)
      ;(host.querySelector('.switcher-tile') as HTMLElement).click()
      await vi.waitFor(() => expect(switcher.isOpen()).toBe(false))

      expect(hidden.window.restore).toHaveBeenCalled()
      expect(hidden.window.getElement().style.display).toBe('')
    })

    // Looking at a window is not the same as asking for it.
    it('goes back out of sight when the overview closes without it', async () => {
      const hidden = makeMinimized('About')
      vi.spyOn(windowManager, 'list').mockReturnValue([hidden, makeWindow('Experience')])

      const switcher = build()
      await switcher.show(host)
      await switcher.close()

      expect(hidden.window.restore).not.toHaveBeenCalled()
      expect(hidden.window.getElement().style.display).toBe('none')
    })
  })

  it('says so when nothing is open', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([])

    const switcher = build()
    await switcher.show(host)

    expect(host.querySelectorAll('.switcher-tile')).toHaveLength(0)
    expect(host.querySelector('.switcher-empty')?.textContent).toContain(
      'No open windows',
    )
  })

  /*
   * The overview drives the real windows rather than thumbnails, so closing it
   * has to hand every inline style back untouched. Leaving a transform behind
   * is what broke dragging: the window stopped following the cursor.
   */
  it('returns every window exactly as it found it', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([makeWindow('About')])
    const el = windows[0]
    el.style.transform = 'translate3d(40px, 20px, 0)'
    el.style.pointerEvents = 'auto'

    const switcher = build()
    await switcher.show(host)
    expect(el.style.transform).not.toBe('translate3d(40px, 20px, 0)')
    expect(el.style.pointerEvents).toBe('none')

    await switcher.close()
    expect(el.style.transform).toBe('translate3d(40px, 20px, 0)')
    expect(el.style.pointerEvents).toBe('auto')
    expect(el.style.transformOrigin).toBe('')
    expect(switcher.isOpen()).toBe(false)
  })

  it('takes the desktop back to full brightness on close', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([makeWindow('About')])

    const switcher = build()
    await switcher.show(host)
    const scrim = desktop.querySelector('.switcher-scrim') as HTMLElement
    expect(scrim.style.opacity).toBe('1')

    await switcher.close()
    expect(scrim.style.opacity).toBe('0')
  })

  it('mounts the dim behind the windows, not over them', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([makeWindow('About')])

    const switcher = build()
    await switcher.show(host)

    // In the desktop, under the windows — never in the overlay on top of them.
    const scrim = desktop.querySelector('.switcher-scrim') as HTMLElement
    expect(scrim).toBeTruthy()
    expect(host.querySelector('.switcher-scrim')).toBeNull()
    expect(scrim.style.zIndex).toBe('0')
  })

  /*
   * Regression, twice over. The tiles first scrolled natively while the
   * windows behind them — fixed-position, so no container can scroll them —
   * were moved by a scroll handler a frame later, and every label ran ahead of
   * the window it named. Making the tiles fixed too locked them together but
   * killed scrolling, because a gesture over a fixed element scrolls the
   * viewport rather than the container it sits in. One offset drives both now.
   */
  const asPhone = () => {
    Object.defineProperty(window, 'innerWidth', { value: PHONE.width, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: PHONE.height, configurable: true })
  }

  const wheel = (deltaY: number) => {
    const event = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true })
    ;(host.querySelector('#switcher') as HTMLElement).dispatchEvent(event)
    return event
  }

  const offsetY = (transform: string) =>
    // Matches both `translateY(-8px)` and `translate(4px, -8px)`.
    Number(/translateY?\((?:[^,]+,\s*)?(-?[\d.]+)px/.exec(transform)?.[1])

  const layer = () => host.querySelector('.switcher-grid') as HTMLElement

  /** Ten cards on a phone is five rows for a two-row viewport. */
  const crowdedPhone = async () => {
    asPhone()
    vi.spyOn(windowManager, 'list').mockReturnValue(
      Array.from({ length: 10 }, (_, i) => makeWindow(`Window ${i + 1}`)),
    )
    const switcher = build()
    await switcher.show(host)
    return switcher
  }

  it('pans the tiles and their windows by the very same offset', async () => {
    await crowdedPhone()
    const before = windows.map((w) => offsetY(w.style.transform))

    wheel(200)

    // The tile layer moves once, for all of them; every window matches it.
    expect(offsetY(layer().style.transform)).toBe(-200)
    windows.forEach((w, i) =>
      expect(offsetY(w.style.transform) - before[i]).toBe(-200),
    )
  })

  it('never pans past either end', async () => {
    await crowdedPhone()

    wheel(99999)
    const bottom = offsetY(layer().style.transform)
    expect(bottom).toBeLessThan(0)

    wheel(99999)
    expect(offsetY(layer().style.transform)).toBe(bottom)

    wheel(-99999)
    expect(Math.abs(offsetY(layer().style.transform))).toBe(0)
  })

  // The overview is modal; the desktop behind it must not scroll as well.
  it('claims the wheel while it can pan, and not otherwise', async () => {
    await crowdedPhone()
    expect(wheel(100).defaultPrevented).toBe(true)
  })

  it('leaves the wheel alone when everything already fits', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([makeWindow('About')])
    const switcher = build()
    await switcher.show(host)

    expect(wheel(100).defaultPrevented).toBe(false)
  })

  // jsdom has no PointerEvent; the handler only reads button and clientY.
  const pointer = (type: string, clientY: number, target: EventTarget) =>
    target.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, clientY, button: 0 }),
    )

  it('pans by dragging, for a finger rather than a wheel', async () => {
    await crowdedPhone()
    const overlay = host.querySelector('#switcher') as HTMLElement

    pointer('pointerdown', 500, overlay)
    pointer('pointermove', 380, window)

    expect(offsetY(layer().style.transform)).toBe(-120)
    pointer('pointerup', 380, window)
  })

  /*
   * A drag is not a tap. Releasing over a card used to open it, and releasing
   * over empty space used to dismiss the whole overview.
   */
  it('does not open a card the drag happened to end on', async () => {
    const switcher = await crowdedPhone()
    const overlay = host.querySelector('#switcher') as HTMLElement
    const tile = host.querySelector('.switcher-tile') as HTMLElement

    pointer('pointerdown', 500, overlay)
    pointer('pointermove', 380, window)
    pointer('pointerup', 380, window)

    tile.click()
    expect(switcher.isOpen()).toBe(true)
  })

  it('still opens a card on a tap that barely moved', async () => {
    const switcher = await crowdedPhone()
    const overlay = host.querySelector('#switcher') as HTMLElement
    const tile = host.querySelector('.switcher-tile') as HTMLElement

    pointer('pointerdown', 500, overlay)
    pointer('pointermove', 498, window)
    pointer('pointerup', 498, window)

    tile.click()
    await vi.waitFor(() => expect(switcher.isOpen()).toBe(false))
  })

  it('hides a window once panned off the top', async () => {
    await crowdedPhone()
    expect(windows[0].style.visibility).toBe('')

    wheel(99999)
    expect(windows[0].style.visibility).toBe('hidden')
  })

  it('picks a window and closes behind it', async () => {
    const about = makeWindow('About')
    vi.spyOn(windowManager, 'list').mockReturnValue([about])

    const switcher = build()
    await switcher.show(host)
    ;(host.querySelector('.switcher-tile') as HTMLElement).click()

    // Focus is handed over only once the overview has finished closing, so
    // wait on the call itself rather than on the open flag, which flips first.
    await vi.waitFor(() =>
      expect(about.window.onActive).toHaveBeenCalledWith(about.window),
    )
    expect(switcher.isOpen()).toBe(false)
  })

  it('toggles, and opening twice is a no-op', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([makeWindow('About')])

    const switcher = build()
    await switcher.toggle(host)
    expect(switcher.isOpen()).toBe(true)

    await switcher.show(host)
    expect(host.querySelectorAll('.switcher-tile')).toHaveLength(1)

    await switcher.toggle(host)
    expect(switcher.isOpen()).toBe(false)
    expect(host.querySelectorAll('.switcher-tile')).toHaveLength(0)
  })

  it('closes on Escape', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([makeWindow('About')])

    const switcher = build()
    await switcher.show(host)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await vi.waitFor(() => expect(switcher.isOpen()).toBe(false))
  })

  it('stops listening for Escape once closed', async () => {
    vi.spyOn(windowManager, 'list').mockReturnValue([makeWindow('About')])

    const switcher = build()
    await switcher.show(host)
    await switcher.close()

    const spy = vi.spyOn(switcher, 'close')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(spy).not.toHaveBeenCalled()
  })
})
