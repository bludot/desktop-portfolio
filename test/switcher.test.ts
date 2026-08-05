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
