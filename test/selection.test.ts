import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import SelectionLayer, { asQuote, mergeLines, windowTitleOf } from '../src/components/Selection'
import Popover, { place } from '../src/components/Popover'

jss.setup(preset())
jss.use(nested())

const rect = (top: number, left: number, right: number, height = 18) => ({
  top,
  bottom: top + height,
  left,
  right,
})

describe('mergeLines', () => {
  /*
   * getClientRects gives a rectangle per line fragment — a bold run mid
   * sentence produces three for one line. Drawn as they come, a single line
   * would look like a row of beads.
   */
  it('joins the fragments of one line into one shape', () => {
    const lines = mergeLines([rect(10, 20, 90), rect(10, 90, 140), rect(10, 140, 200)])
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ left: 20, right: 200 })
  })

  it('keeps separate lines separate', () => {
    expect(mergeLines([rect(10, 20, 200), rect(30, 20, 120)])).toHaveLength(2)
  })

  // Sub-pixel differences in line boxes are normal and must not split a line.
  it('treats a hair of difference as the same line', () => {
    expect(mergeLines([rect(10, 20, 90), rect(11.5, 90, 140)])).toHaveLength(1)
  })

  it('throws away rectangles with no area', () => {
    expect(mergeLines([rect(10, 20, 20), { top: 5, bottom: 5, left: 0, right: 90 }])).toEqual([])
  })

  it('says nothing about nothing', () => {
    expect(mergeLines([])).toEqual([])
  })
})

describe('place', () => {
  const panel = { width: 140, height: 34 }
  const viewport = { width: 1000, height: 800 }

  it('centres above the anchor', () => {
    const { left, top, side } = place(rect(200, 400, 600), panel, viewport)
    expect(side).toBe('above')
    expect(left).toBe(500 - 70)
    expect(top).toBe(200 - 34 - 8)
  })

  // An anchor against the top of the screen has no room above it.
  it('flips below when it will not fit above', () => {
    const { top, side } = place(rect(10, 400, 600), panel, viewport)
    expect(side).toBe('below')
    expect(top).toBe(28 + 8)
  })

  it('flips above when it will not fit below', () => {
    const { side } = place(rect(770, 400, 600), panel, viewport, { prefer: 'below' })
    expect(side).toBe('above')
  })

  it('keeps clear of both edges', () => {
    expect(place(rect(200, 0, 20), panel, viewport).left).toBe(6)
    expect(place(rect(200, 980, 1000), panel, viewport).left).toBe(1000 - 140 - 6)
  })

  // Nowhere to go: over the text beats off the bottom of the screen.
  it('prefers above when neither side fits', () => {
    expect(place(rect(0, 400, 600), panel, { width: 1000, height: 60 }).side).toBe('above')
  })
})

describe('quoting', () => {
  it('credits the window it came from', () => {
    expect(asQuote('  a line of prose  ', 'Experience')).toBe('“a line of prose” — Experience')
  })

  it('leaves off the credit when there is nothing to credit', () => {
    expect(asQuote('a line', '')).toBe('“a line”')
  })
})

describe('windowTitleOf', () => {
  it('finds the window a node sits in', () => {
    const win = document.createElement('window')
    const title = document.createElement('span')
    title.className = 'title-name'
    title.textContent = 'Experience'
    const text = document.createElement('p')
    win.append(title, text)
    document.body.appendChild(win)

    expect(windowTitleOf(text)).toBe('Experience')
    expect(windowTitleOf(text.appendChild(document.createTextNode('x')))).toBe('Experience')
    win.remove()
  })

  it('says nothing for a node outside any window', () => {
    expect(windowTitleOf(document.createElement('p'))).toBe('')
    expect(windowTitleOf(null)).toBe('')
  })
})

describe('Popover', () => {
  let host: HTMLElement
  let popover: Popover

  beforeEach(async () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    popover = new Popover('test-popover')
    await popover.load(host)
  })

  afterEach(async () => {
    await popover.unload()
    host.remove()
  })

  it('builds a row of actions, with dividers where asked', () => {
    popover.setActions([
      { label: 'Copy', onPress: vi.fn() },
      { label: 'Quote', onPress: vi.fn(), separated: true },
    ])

    expect([...popover.getElement().querySelectorAll('button')].map((b) => b.textContent))
      .toEqual(['Copy', 'Quote'])
    expect(popover.getElement().querySelectorAll('.popover-divider')).toHaveLength(1)
  })

  it('does not draw a leading divider', () => {
    popover.setActions([{ label: 'Copy', onPress: vi.fn(), separated: true }])
    expect(popover.getElement().querySelectorAll('.popover-divider')).toHaveLength(0)
  })

  it('runs the action it was given', () => {
    const onPress = vi.fn()
    popover.setActions([{ label: 'Copy', onPress }])
    popover.getElement().querySelector('button')!.click()
    expect(onPress).toHaveBeenCalled()
  })

  it('opens and closes', () => {
    expect(popover.isOpen()).toBe(false)
    popover.showAt(rect(200, 400, 600))
    expect(popover.isOpen()).toBe(true)
    expect(popover.getElement().classList.contains('is-open')).toBe(true)

    popover.hide()
    expect(popover.isOpen()).toBe(false)
  })

  /*
   * A press inside the panel must not disturb what is outside it: a mousedown
   * outside a selection collapses it, so Copy would find nothing to copy.
   */
  it('refuses to take the selection away when pressed', () => {
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    popover.getElement().dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('says something happened, then puts the buttons back', async () => {
    vi.useFakeTimers()
    popover.setActions([
      { label: 'Copy', onPress: vi.fn() },
      { label: 'Quote', onPress: vi.fn() },
    ])

    popover.flash('Copied')
    const buttons = [...popover.getElement().querySelectorAll('button')]
    expect(buttons[0].textContent).toBe('Copied')
    // The panel must not change size while it answers.
    expect(buttons[1].style.visibility).toBe('hidden')

    await vi.advanceTimersByTimeAsync(1000)
    expect(buttons[0].textContent).toBe('Copy')
    expect(buttons[1].style.visibility).toBe('')
    vi.useRealTimers()
  })

  it('takes arbitrary content too', () => {
    const custom = document.createElement('p')
    custom.textContent = 'anything'
    popover.setContent(custom)
    expect(popover.getElement().textContent).toBe('anything')
  })
})

describe('SelectionLayer', () => {
  let host: HTMLElement
  let layer: SelectionLayer

  const stubHover = (touch: boolean) => {
    ;(window as any).matchMedia = (query: string) => ({
      matches: touch && query.includes('hover: none'),
      media: query,
      addEventListener: () => {},
    })
  }

  const selectRects = (rects: ReturnType<typeof rect>[], text = 'some words') => {
    const range = {
      getClientRects: () => rects,
      commonAncestorContainer: document.body,
    }
    ;(document as any).getSelection = () => ({
      isCollapsed: rects.length === 0,
      rangeCount: rects.length ? 1 : 0,
      toString: () => (rects.length ? text : ''),
      getRangeAt: () => range,
    })
  }

  beforeEach(async () => {
    stubHover(false)
    host = document.createElement('div')
    document.body.appendChild(host)
    layer = new SelectionLayer()
    await layer.load(host)
  })

  afterEach(async () => {
    await layer.unload()
    host.remove()
    delete (window as any).matchMedia
  })

  it('draws a shape per line, a little larger than the text', () => {
    selectRects([rect(100, 40, 300), rect(120, 40, 200)])
    layer.paint()

    const bubbles = [
      ...layer.getElement().querySelectorAll<HTMLElement>('.selection-bubble'),
    ]
    expect(bubbles).toHaveLength(2)
    // Padded by two each side, one above and below.
    expect(bubbles[0].style.left).toBe('38px')
    expect(bubbles[0].style.width).toBe('264px')
    expect(bubbles[0].style.top).toBe('99px')
    expect(bubbles[0].style.height).toBe('20px')
  })

  /*
   * Text moves for reasons that fire no event — a window dragged or resized, a
   * pane animating, a scroll dropped because the tab is throttled — so the
   * layer follows the selection by frame rather than by listener.
   */
  it('redraws when the text has moved under it', () => {
    selectRects([rect(100, 40, 300)])
    layer.paint()
    expect(
      layer.getElement().querySelector<HTMLElement>('.selection-bubble')!.style.top,
    ).toBe('99px')

    // The same selection, now eighty pixels further up the screen.
    selectRects([rect(20, 40, 300)])
    layer.paint()
    expect(
      layer.getElement().querySelector<HTMLElement>('.selection-bubble')!.style.top,
    ).toBe('19px')
  })

  // Sixty times a second, so an unmoved selection must cost nothing.
  it('writes nothing when a frame finds everything where it left it', () => {
    selectRects([rect(100, 40, 300)])
    layer.paint()
    const first = layer.getElement().querySelector('.selection-bubble')

    layer.paint()
    expect(layer.getElement().querySelector('.selection-bubble')).toBe(first)
  })

  it('reports whether it is still worth following', () => {
    selectRects([rect(100, 40, 300)])
    expect(layer.paint()).toBe(true)

    selectRects([])
    expect(layer.paint()).toBe(false)
  })

  it('clears everything when the selection goes', () => {
    selectRects([rect(100, 40, 300)])
    layer.paint()
    expect(layer.getElement().querySelectorAll('.selection-bubble')).toHaveLength(1)

    selectRects([])
    layer.paint()
    expect(layer.getElement().querySelectorAll('.selection-bubble')).toHaveLength(0)
  })

  // Whitespace is not a selection worth decorating.
  it('ignores a selection of nothing but space', () => {
    selectRects([rect(100, 40, 300)], '   \n  ')
    layer.paint()
    expect(layer.getElement().querySelectorAll('.selection-bubble')).toHaveLength(0)
  })

  /*
   * Turned off only once the layer is mounted, so a desktop where it never
   * loads still shows a selection — square, but visible.
   */
  it('takes over the native paint only while it is mounted', async () => {
    expect(document.documentElement.classList.contains('has-selection-layer')).toBe(true)
    await layer.unload()
    expect(document.documentElement.classList.contains('has-selection-layer')).toBe(false)
    // Re-mounted so afterEach has something to unload.
    layer = new SelectionLayer()
    await layer.load(host)
  })

  it('keeps its toolbar to itself on touch, where the platform has its own', () => {
    stubHover(true)
    selectRects([rect(100, 40, 300)])
    layer.paint()

    expect(layer.getElement().querySelectorAll('.selection-bubble')).toHaveLength(1)
    expect(document.querySelector('#selection-popover')?.classList.contains('is-open')).toBe(false)
  })
})
