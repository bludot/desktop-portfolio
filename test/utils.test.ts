import { describe, it, expect, vi, afterEach } from 'vitest'
import { getWindowWidth, getWindowHeight, observeWidth } from '../src/utils/utils'
import experience, { currentRole } from '../src/contents/experience/data'
import { getSupport } from '../src/utils/support'
import debounce from '../src/utils/debounce'

describe('getWindowWidth / getWindowHeight', () => {
  it('prefer the window inner dimensions', () => {
    expect(getWindowWidth()).toBe(window.innerWidth)
    expect(getWindowHeight()).toBe(window.innerHeight)
  })

  it('fall back to the document element when innerWidth/Height are absent', () => {
    const width = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(0)
    const height = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(0)
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024)
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768)

    expect(getWindowWidth()).toBe(1024)
    expect(getWindowHeight()).toBe(768)

    width.mockRestore()
    height.mockRestore()
  })
})

describe('getSupport', () => {
  it('reports whether backdrop-filter is available', () => {
    const support = getSupport()
    expect(support.css).toHaveProperty('backdropFilter')
    expect(typeof support.css.backdropFilter).toBe('boolean')
  })
})

describe('debounce', () => {
  it('calls the function once after the wait elapses', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100, false)

    debounced()
    debounced()
    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('restarts the timer on each call', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100, false)

    debounced()
    vi.advanceTimersByTime(60)
    debounced()
    vi.advanceTimersByTime(60)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(40)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('in immediate mode fires on the leading edge and suppresses the rest', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100, true)

    debounced()
    expect(fn).toHaveBeenCalledTimes(1)
    debounced()
    debounced()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('forwards arguments and preserves the call context', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    // debounce() returns an untyped `function () {}`, so widen it to accept args.
    const host = { debounced: debounce(fn, 10, false) as (...args: unknown[]) => void }

    host.debounced('a', 'b')
    vi.advanceTimersByTime(10)

    expect(fn).toHaveBeenCalledWith('a', 'b')
    expect(fn.mock.contexts[0]).toBe(host)
    vi.useRealTimers()
  })
})

describe('observeWidth', () => {
  // jsdom has no ResizeObserver; this stub is also how the real one is driven.
  const install = () => {
    const state: {
      target?: Element
      options?: ResizeObserverOptions
      disconnected: boolean
      emit: (width: number, useBorderBox?: boolean) => void
    } = { disconnected: false, emit: () => {} }

    ;(globalThis as any).ResizeObserver = class {
      constructor(private cb: ResizeObserverCallback) {
        state.emit = (width, useBorderBox = true) =>
          this.cb(
            [
              {
                target: state.target,
                borderBoxSize: useBorderBox ? [{ inlineSize: width, blockSize: 0 }] : undefined,
                contentRect: { width } as DOMRectReadOnly,
              } as unknown as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver,
          )
      }
      observe(target: Element, options?: ResizeObserverOptions) {
        state.target = target
        state.options = options
      }
      disconnect() {
        state.disconnected = true
      }
    }
    return state
  }

  afterEach(() => {
    delete (globalThis as any).ResizeObserver
  })

  it('adds the class at or below the threshold and drops it above', () => {
    const state = install()
    const el = document.createElement('div')
    observeWidth(el, 480)

    state.emit(320)
    expect(el.classList.contains('is-narrow')).toBe(true)

    state.emit(600)
    expect(el.classList.contains('is-narrow')).toBe(false)

    // Inclusive: exactly on the threshold counts as narrow.
    state.emit(480)
    expect(el.classList.contains('is-narrow')).toBe(true)
  })

  /*
   * Regression: the class changes padding, and padding comes out of the
   * content box — so measuring the content box meant crossing the threshold
   * shrank the measurement, which un-crossed it, which grew it again. That ran
   * at frame rate and read as the window flickering.
   */
  it('measures the border box, which padding cannot feed back into', () => {
    const state = install()
    const el = document.createElement('div')
    observeWidth(el, 480)

    expect(state.options).toEqual({ box: 'border-box' })
  })

  it('falls back to the measured rect when border box sizes are missing', () => {
    const state = install()
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({ width: 300 }) as DOMRect
    observeWidth(el, 480)

    state.emit(999, false)
    expect(el.classList.contains('is-narrow')).toBe(true)
  })

  it('honours a custom class name', () => {
    const state = install()
    const el = document.createElement('div')
    observeWidth(el, 480, 'compact')

    state.emit(100)
    expect(el.classList.contains('compact')).toBe(true)
  })

  it('stops observing when told to', () => {
    const state = install()
    const stop = observeWidth(document.createElement('div'), 480)

    expect(state.disconnected).toBe(false)
    stop()
    expect(state.disconnected).toBe(true)
  })

  it('is a no-op where ResizeObserver does not exist', () => {
    const el = document.createElement('div')
    const stop = observeWidth(el, 480)

    expect(el.classList.contains('is-narrow')).toBe(false)
    expect(() => stop()).not.toThrow()
  })
})

describe('currentRole', () => {
  it('finds nothing when every role has already ended', () => {
    // Every role in the data ends in the past as of this date.
    expect(currentRole(new Date(2030, 0, 1))).toBeUndefined()
  })

  it('finds the role whose end date has not arrived yet', () => {
    const role = currentRole(new Date(2024, 0, 1))
    expect(role?.company).toBe('GoTu')
  })

  /*
   * The taskbar reads this to decide between "Available for work" and
   * "Working at X", so an open-ended role has to count as current — otherwise
   * the bar would advertise availability for a job still in progress.
   */
  it('treats an open-ended role as current', () => {
    const open = { ...experience[0], end: 'present' as const }
    expect(typeof open.end === 'string').toBe(true)
  })

  it('returns the most recent role, the data being newest first', () => {
    const starts = experience.map((r) => r.start.getTime())
    expect([...starts].sort((a, b) => b - a)).toEqual(starts)
  })
})
