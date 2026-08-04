import { describe, it, expect, vi, afterEach } from 'vitest'
import { getWindowWidth, getWindowHeight } from '../src/utils/utils'
import { getSupport } from '../src/utils/support'
import bridge from '../src/utils/bridge'
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

describe('bridge', () => {
  afterEach(() => {
    // The bridge is a module-level singleton; put it back as we found it.
    ;(bridge as any).Desktop = null
  })

  it('stores and returns a registered value', () => {
    const desktop = { name: 'desktop' }
    bridge.set('Desktop', desktop)
    expect(bridge.get('Desktop')).toBe(desktop)
  })

  it('refuses to set a key it does not declare', () => {
    expect(() => bridge.set('Nope', 1)).toThrow('Not valid')
  })

  it('throws when reading a key that was never set', () => {
    expect(() => bridge.get('Desktop')).toThrow('Not valid')
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
