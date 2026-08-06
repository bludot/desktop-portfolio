import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import ScrollBar, { ScrollBars, overlayScroll } from '../src/components/Scrollbar'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement
let scroller: HTMLElement

// jsdom has no layout, so these have to be declared.
const withGeometry = (el: HTMLElement, client: number, scroll: number) => {
  Object.defineProperty(el, 'clientHeight', { value: client, configurable: true })
  Object.defineProperty(el, 'scrollHeight', { value: scroll, configurable: true })
  Object.defineProperty(el, 'offsetTop', { value: 32, configurable: true })
  el.getBoundingClientRect = () =>
    ({ top: 32, left: 0, right: 300, bottom: 32 + client, width: 300, height: client }) as DOMRect
  return el
}

const makeScroller = (client = 200, scroll = 1000) => {
  const el = withGeometry(document.createElement('div'), client, scroll)
  host.appendChild(el)
  return el
}

const mountScrollbar = async (target?: HTMLElement) => {
  const bar = new ScrollBar()
  bar.attachTo(target ?? scroller)
  // Mounted on the window, not inside the scrolling box.
  await bar.load(host)
  await vi.advanceTimersByTimeAsync(0)
  return bar
}

const thumb = (bar: ScrollBar) => bar.getElement().querySelector<HTMLElement>('.bar')!

const mouse = (type: string, clientX: number, clientY: number) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY })

describe('ScrollBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    host = document.createElement('div')
    document.body.appendChild(host)
    // 200px viewport over 1000px of content: 800px of scroll range.
    scroller = makeScroller()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a thumb', () => {
    expect(thumb(new ScrollBar())).toBeTruthy()
  })

  // The whole point: the container keeps scrolling itself, so trackpad
  // momentum, OS scroll settings, keyboard paging and find-in-page all survive.
  describe('does not hijack scrolling', () => {
    it('leaves the container scrollable natively', async () => {
      await mountScrollbar()
      expect(scroller.style.overflowY).toBe('auto')
      expect(scroller.style.overflow).not.toBe('hidden')
    })

    it('hides the platform bar rather than disabling scrolling', async () => {
      await mountScrollbar()
      expect(scroller.classList.contains('hide-native-scrollbar')).toBe(true)
      expect((scroller.style as any).scrollbarWidth).toBe('none')
    })

    it('does not intercept the wheel', async () => {
      await mountScrollbar()
      const event = new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true })
      scroller.dispatchEvent(event)
      // Untouched, so the browser scrolls it however the platform prefers.
      expect(event.defaultPrevented).toBe(false)
      expect(scroller.scrollTop).toBe(0)
    })

    it('mounts outside the scrolling box so it never scrolls away', async () => {
      const bar = await mountScrollbar()
      expect(scroller.contains(bar.getElement())).toBe(false)
      expect(host.contains(bar.getElement())).toBe(true)
    })
  })

  describe('geometry', () => {
    it('sizes the thumb in proportion to how much content there is', async () => {
      const bar = await mountScrollbar()
      // 200/1000 of a 200px track = 40px.
      expect(thumb(bar).style.height).toBe('40px')
    })

    it('never shrinks the thumb below a grabbable size', async () => {
      const bar = await mountScrollbar(makeScroller(200, 100000))
      expect(parseFloat(thumb(bar).style.height)).toBeGreaterThanOrEqual(24)
    })

    it('hides itself entirely when the content fits', async () => {
      const bar = await mountScrollbar(makeScroller(200, 200))
      expect(bar.getElement().style.display).toBe('none')
    })

    it('lines the track up with the scrolling box', async () => {
      const bar = await mountScrollbar()
      expect(bar.getElement().style.top).toBe('32px')
      expect(bar.getElement().style.height).toBe('200px')
    })

    it('follows the native scroll position, ending flush at the bottom', async () => {
      const bar = await mountScrollbar()

      scroller.scrollTop = 800
      scroller.dispatchEvent(new Event('scroll'))
      expect(thumb(bar).style.top).toBe('160px')

      scroller.scrollTop = 400
      scroller.dispatchEvent(new Event('scroll'))
      expect(thumb(bar).style.top).toBe('80px')

      scroller.scrollTop = 0
      scroller.dispatchEvent(new Event('scroll'))
      expect(thumb(bar).style.top).toBe('0px')
    })
  })

  describe('visibility', () => {
    it('appears when the pointer comes near the right edge', async () => {
      const bar = await mountScrollbar()
      bar.hide()
      // The box spans x 0..300; 280 is within 40px of the edge.
      scroller.dispatchEvent(mouse('mousemove', 280, 100))
      expect(bar.getElement().style.opacity).toBe('1')
    })

    it('stays hidden while the pointer is far from the edge', async () => {
      const bar = await mountScrollbar()
      bar.hide()
      scroller.dispatchEvent(mouse('mousemove', 20, 100))
      expect(bar.getElement().style.opacity).toBe('0')
    })

    it('does not appear when there is nothing to scroll', async () => {
      const shortScroller = makeScroller(200, 200)
      const bar = await mountScrollbar(shortScroller)
      bar.hide()
      shortScroller.dispatchEvent(mouse('mousemove', 295, 100))
      expect(bar.getElement().style.opacity).toBe('0')
    })

    it('appears while scrolling and hides once it stops', async () => {
      const bar = await mountScrollbar()
      scroller.scrollTop = 100
      scroller.dispatchEvent(new Event('scroll'))
      expect(bar.getElement().style.opacity).toBe('1')

      await vi.advanceTimersByTimeAsync(1000)
      expect(bar.getElement().style.opacity).toBe('0')
    })

    it('hides when the pointer leaves', async () => {
      const bar = await mountScrollbar()
      scroller.dispatchEvent(mouse('mousemove', 295, 100))
      expect(bar.getElement().style.opacity).toBe('1')

      scroller.dispatchEvent(new MouseEvent('mouseleave'))
      await vi.advanceTimersByTimeAsync(1000)
      expect(bar.getElement().style.opacity).toBe('0')
    })

    it('stays visible while the thumb is being dragged', async () => {
      const bar = await mountScrollbar()
      thumb(bar).dispatchEvent(mouse('mousedown', 295, 10))
      await vi.advanceTimersByTimeAsync(2000)
      expect(bar.getElement().style.opacity).toBe('1')
    })
  })

  describe('dragging the thumb', () => {
    it('scrolls the container proportionally to the drag', async () => {
      const bar = await mountScrollbar()
      thumb(bar).dispatchEvent(mouse('mousedown', 295, 0))

      // Track travel is 200-40=160px; 80px of it is half the 800px range.
      window.dispatchEvent(mouse('mousemove', 295, 80))

      expect(scroller.scrollTop).toBe(400)
      expect(thumb(bar).style.top).toBe('80px')
    })

    it('clamps at both ends', async () => {
      const bar = await mountScrollbar()
      thumb(bar).dispatchEvent(mouse('mousedown', 295, 0))

      window.dispatchEvent(mouse('mousemove', 295, 10000))
      expect(scroller.scrollTop).toBe(800)

      window.dispatchEvent(mouse('mousemove', 295, -10000))
      expect(scroller.scrollTop).toBe(0)
    })

    it('suppresses the text selection a drag would otherwise start', async () => {
      const bar = await mountScrollbar()
      const event = mouse('mousedown', 295, 10)
      thumb(bar).dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })

    it('stops scrolling once released', async () => {
      const bar = await mountScrollbar()
      thumb(bar).dispatchEvent(mouse('mousedown', 295, 0))
      window.dispatchEvent(mouse('mousemove', 295, 40))
      const atRelease = scroller.scrollTop
      window.dispatchEvent(mouse('mouseup', 295, 40))

      window.dispatchEvent(mouse('mousemove', 295, 160))
      expect(scroller.scrollTop).toBe(atRelease)
    })
  })

  it('detaches its listeners on unload', async () => {
    const bar = await mountScrollbar()
    await bar.unload()

    scroller.scrollTop = 500
    scroller.dispatchEvent(new Event('scroll'))
    // No longer tracking, so the thumb stays where it was.
    expect(thumb(bar).style.top).toBe('0px')
  })

  // A pane that redraws throws its content away first, taking any track mounted
  // inside it. Tidying up after that must not be an error.
  it('unloads cleanly when its host has already been emptied', async () => {
    const bar = await mountScrollbar()
    host.textContent = ''
    await expect(bar.unload()).resolves.toBeUndefined()
  })
})

/*
 * Sideways. A code block, a wide table, a source listing: boxes that keep their
 * long line rather than wrapping it, and grew the platform's own bar along the
 * bottom before this.
 */
describe('ScrollBar along the bottom', () => {
  let wide: HTMLElement

  // 200px of box over 1000px of line: 800px of range, as above but turned.
  const makeWideScroller = (client = 200, scroll = 1000, height = 60) => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'clientWidth', { value: client, configurable: true })
    Object.defineProperty(el, 'scrollWidth', { value: scroll, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: height, configurable: true })
    Object.defineProperty(el, 'offsetLeft', { value: 8, configurable: true })
    Object.defineProperty(el, 'offsetTop', { value: 12, configurable: true })
    el.getBoundingClientRect = () =>
      ({ top: 12, bottom: 12 + height, left: 8, right: 8 + client, width: client, height }) as DOMRect
    host.appendChild(el)
    return el
  }

  const mountWide = async (target?: HTMLElement) => {
    const bar = new ScrollBar('x')
    bar.attachTo(target ?? wide)
    await bar.load(host)
    await vi.advanceTimersByTimeAsync(0)
    return bar
  }

  beforeEach(() => {
    vi.useFakeTimers()
    host = document.createElement('div')
    document.body.appendChild(host)
    wide = makeWideScroller()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('leaves the box scrolling itself sideways', async () => {
    await mountWide()
    expect(wide.style.overflowX).toBe('auto')
    expect(wide.classList.contains('hide-native-scrollbar')).toBe(true)
  })

  it('lays the track along the bottom edge of the box', async () => {
    const bar = await mountWide()
    expect(bar.getElement().style.left).toBe('8px')
    // Bottom of the box, less the thickness of the track itself.
    expect(bar.getElement().style.top).toBe('62px')
    expect(bar.getElement().style.width).toBe('200px')
  })

  it('sizes the thumb against the length of the line', async () => {
    const bar = await mountWide()
    expect(thumb(bar).style.width).toBe('40px')
  })

  it('follows the native scroll position', async () => {
    const bar = await mountWide()
    wide.scrollLeft = 400
    wide.dispatchEvent(new Event('scroll'))
    // Track travel is 200-40=160px; half the 800px range is 80px along it.
    expect(thumb(bar).style.left).toBe('80px')
  })

  it('drags sideways', async () => {
    const bar = await mountWide()
    thumb(bar).dispatchEvent(mouse('mousedown', 0, 40))
    window.dispatchEvent(mouse('mousemove', 80, 40))
    expect(wide.scrollLeft).toBe(400)
  })

  /*
   * Anywhere over the box, unlike the vertical bar. These are a few lines tall,
   * so "within 40px of the bottom" would be most of the box anyway — and the
   * pointer is usually in the middle of the code it is about to scroll.
   */
  it('appears for the pointer anywhere over the box', async () => {
    const bar = await mountWide()
    bar.hide()
    wide.dispatchEvent(mouse('mousemove', 100, 20))
    expect(bar.getElement().style.opacity).toBe('1')
  })

  it('stays hidden while the pointer is outside it', async () => {
    const bar = await mountWide()
    bar.hide()
    wide.dispatchEvent(mouse('mousemove', 100, 400))
    expect(bar.getElement().style.opacity).toBe('0')
  })
})

describe('overlayScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    host = document.createElement('div')
    document.body.appendChild(host)
    scroller = makeScroller()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hangs the track on a parent that can hold it', async () => {
    host.style.position = 'relative'
    const bar = overlayScroll(scroller)
    await vi.advanceTimersByTimeAsync(0)

    expect(bar.getElement().parentElement).toBe(host)
    expect(host.querySelector('.scroll-host')).toBeNull()
  })

  // A code block in the middle of a README: its parent is the prose, which is
  // not positioned and would put the track somewhere else entirely.
  it('makes a box for the track when the parent will not do', async () => {
    const bar = overlayScroll(scroller)
    await vi.advanceTimersByTimeAsync(0)

    const wrapper = host.querySelector<HTMLElement>('.scroll-host')!
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.position).toBe('relative')
    // Wrapped in place: the scrolling box is still where it was in the document.
    expect(scroller.parentElement).toBe(wrapper)
    expect(bar.getElement().parentElement).toBe(wrapper)
  })

  // Window content is built before the window is on screen, and nothing
  // detached has a computed position to go on.
  it('takes a host it is given rather than working one out', async () => {
    const named = document.createElement('div')
    host.appendChild(named)

    const bar = overlayScroll(scroller, 'y', named)
    await vi.advanceTimersByTimeAsync(0)

    expect(bar.getElement().parentElement).toBe(named)
    expect(host.querySelector('.scroll-host')).toBeNull()
  })
})

describe('ScrollBars', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    host = document.createElement('div')
    host.style.position = 'relative'
    document.body.appendChild(host)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hangs one on everything the selector finds', async () => {
    host.appendChild(document.createElement('pre'))
    host.appendChild(document.createElement('pre'))

    const bars = new ScrollBars()
    bars.attach(host, 'pre', 'x')
    await vi.advanceTimersByTimeAsync(0)

    expect(host.querySelectorAll('scrollbar').length).toBe(2)
  })

  it('drops them all when the content is redrawn', async () => {
    host.appendChild(document.createElement('pre'))
    const bars = new ScrollBars()
    bars.attach(host, 'pre', 'x')
    await vi.advanceTimersByTimeAsync(0)

    bars.clear()
    await vi.advanceTimersByTimeAsync(0)
    expect(host.querySelectorAll('scrollbar').length).toBe(0)
  })
})
