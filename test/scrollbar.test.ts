import { describe, it, expect, beforeEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import ScrollBar from '../src/components/Scrollbar'

jss.setup(preset())
jss.use(nested())

let container: HTMLElement

// jsdom has no layout, so clientHeight/scrollHeight are 0 unless we define
// them. Give the container a believable scrollable geometry.
const withGeometry = (el: HTMLElement, client: number, scroll: number) => {
  Object.defineProperty(el, 'clientHeight', { value: client, configurable: true })
  Object.defineProperty(el, 'scrollHeight', { value: scroll, configurable: true })
  return el
}

const mountScrollbar = async () => {
  const bar = new ScrollBar()
  await bar.load(container)
  // load() defers its wiring to a setTimeout(0).
  await vi.advanceTimersByTimeAsync(0)
  return bar
}

const touch = (type: string, clientY: number) =>
  ({
    type,
    touches: [{ clientY }],
    changedTouches: [{ clientY }],
    preventDefault: () => {},
  }) as unknown as TouchEvent

describe('ScrollBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    container = withGeometry(document.createElement('div'), 100, 400)
    document.body.appendChild(container)
  })

  it('renders a bar element', () => {
    const bar = new ScrollBar()
    expect(bar.getElement().querySelector('.bar')).toBeTruthy()
  })

  it('sizes itself against the parent once mounted', async () => {
    const bar = await mountScrollbar()
    expect(container.contains(bar.getElement())).toBe(true)
    expect(container.style.overflow).toBe('hidden')
    vi.useRealTimers()
  })

  it('hide tucks the bar off the right edge', () => {
    const bar = new ScrollBar()
    bar.hide()
    expect(bar.getElement().style.right).toBe('-10px')
    vi.useRealTimers()
  })

  it('scrolling moves the parent and reveals the bar', async () => {
    const bar = await mountScrollbar()
    const wheel = new WheelEvent('mousewheel', { deltaY: 40 })

    bar.scroll(wheel)

    expect(bar.getElement().style.right).toBe('0px')
    expect(container.scrollTop).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('hides again once scrolling stops', async () => {
    const bar = await mountScrollbar()
    bar.scroll(new WheelEvent('mousewheel', { deltaY: 40 }))
    expect(bar.getElement().style.right).toBe('0px')

    await vi.advanceTimersByTimeAsync(1000)

    expect(bar.getElement().style.right).toBe('-10px')
    vi.useRealTimers()
  })

  describe('touch', () => {
    it('touchStart records the origin and current scroll offset', async () => {
      const bar = await mountScrollbar()
      container.scrollTop = 25

      bar.touchStart(touch('touchstart', 200))

      expect(bar.getElement().style.right).toBe('0px')
      expect((bar as any).touchStartY).toBe(200)
      expect((bar as any).scrollTop).toBe(25)
      vi.useRealTimers()
    })

    it('touchMove scrolls the parent by the drag delta', async () => {
      const bar = await mountScrollbar()
      bar.touchStart(touch('touchstart', 200))

      // Dragging up by 50px scrolls down by 50px.
      bar.touchMove(touch('touchmove', 150))

      expect(container.scrollTop).toBe(50)
      vi.useRealTimers()
    })

    it('touchEnd schedules the hide', async () => {
      const bar = await mountScrollbar()
      bar.touchStart(touch('touchstart', 200))
      bar.touchMove(touch('touchmove', 150))
      bar.touchEnd(touch('touchend', 150))

      await vi.advanceTimersByTimeAsync(1000)
      expect(bar.getElement().style.right).toBe('-10px')
      vi.useRealTimers()
    })

    it('handleFlick animates in the requested direction', async () => {
      const bar = await mountScrollbar()
      const raf = vi
        .spyOn(globalThis, 'requestAnimationFrame')
        .mockImplementation(() => 0 as any)

      bar.handleFlick(120)
      bar.handleFlick(-120)

      expect(raf).toHaveBeenCalled()
      raf.mockRestore()
      vi.useRealTimers()
    })
  })
})
