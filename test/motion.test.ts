import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  play,
  enter,
  motion,
  prefersReducedMotion,
  swapAppearance,
  centreOf,
  reachFrom,
} from '../src/utils/motion'
import { motion as token, FEATHER_PX } from '../src/theme'

let el: HTMLElement

/**
 * jsdom implements neither Element.animate nor matchMedia, so both are stubbed
 * here. That is the same pair of gaps the module has to survive in an old
 * browser, which makes these tests the real contract rather than a simulation.
 */
const stubAnimate = () => {
  const calls: Array<{ keyframes: Keyframe[]; options: KeyframeAnimationOptions }> = []
  ;(el as any).animate = (keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    calls.push({ keyframes, options })
    return { finished: Promise.resolve() }
  }
  return calls
}

const stubMatchMedia = (reduced: boolean) => {
  ;(window as any).matchMedia = (query: string) => ({
    matches: reduced && query.includes('reduce'),
    media: query,
  })
}

/*
 * Regression: the start menu blinked as it finished opening. It hid itself
 * inline before mounting and cleared that hide only after awaiting the
 * entrance — but entrances fill `backwards`, so on the last frame the element
 * fell back to the cascade and found the inline `opacity: 0` still there.
 */
describe('enter', () => {
  beforeEach(() => {
    el = document.createElement('div')
    document.body.appendChild(el)
    stubMatchMedia(false)
  })

  afterEach(() => {
    el.remove()
  })

  it('hides the element before the entrance is created', () => {
    let seenAtStart: string | undefined
    const start = (target: HTMLElement) => {
      seenAtStart = target.style.opacity
      return Promise.resolve()
    }

    enter(el, start)
    expect(seenAtStart).toBe('0')
  })

  // Synchronously, not after awaiting: the gap between the animation ending
  // and a later continuation is exactly one paintable frame at zero.
  it('clears the hide without waiting for the animation to finish', () => {
    let settle: (() => void) | undefined
    const start = () => new Promise<void>((resolve) => { settle = resolve })

    const running = enter(el, start)

    expect(el.style.opacity).toBe('')
    settle!()
    return running
  })

  it('leaves nothing behind once the entrance has run', async () => {
    await enter(el, () => Promise.resolve())
    expect(el.style.opacity).toBe('')
  })

  // Where nothing animates, the element simply appears — which is the right
  // answer under reduced motion rather than a special case.
  it('shows the element at once when there is no animation to play', async () => {
    stubMatchMedia(true)
    await enter(el, motion.popIn)
    expect(el.style.opacity).toBe('')
  })
})

describe('motion', () => {
  beforeEach(() => {
    el = document.createElement('div')
    document.body.appendChild(el)
  })

  afterEach(() => {
    delete (window as any).matchMedia
  })

  describe('graceful degradation', () => {
    it('resolves without touching the element when animation is unavailable', async () => {
      // No stub: jsdom has no Element.animate, like an old browser.
      expect(typeof (el as any).animate).toBe('undefined')
      await expect(play(el, [{ opacity: 0 }, { opacity: 1 }])).resolves.toBeUndefined()
    })

    it('treats a missing matchMedia as motion allowed', () => {
      expect(prefersReducedMotion()).toBe(false)
    })

    it('reports reduced motion when the viewer asks for it', () => {
      stubMatchMedia(true)
      expect(prefersReducedMotion()).toBe(true)
    })

    // The point of centralising this: callers await the same promise either
    // way, so no component needs a reduced-motion branch of its own.
    it('skips the animation entirely under reduced motion, but still resolves', async () => {
      const calls = stubAnimate()
      stubMatchMedia(true)

      await expect(motion.windowIn(el)).resolves.toBeUndefined()
      expect(calls).toHaveLength(0)
    })

    it('animates normally when motion is allowed', async () => {
      const calls = stubAnimate()
      stubMatchMedia(false)

      await motion.windowIn(el)
      expect(calls).toHaveLength(1)
    })
  })

  describe('play', () => {
    beforeEach(() => stubMatchMedia(false))

    it('passes the keyframes through and fills from the theme', async () => {
      const calls = stubAnimate()
      await play(el, [{ opacity: 0 }, { opacity: 1 }])

      expect(calls[0].keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }])
      expect(calls[0].options.duration).toBe(token.base)
      expect(calls[0].options.easing).toBe(token.standard)
      expect(calls[0].options.fill).toBe('backwards')
    })

    // Regression: a filled-forwards animation keeps applying its final
    // keyframe, and animation values beat inline styles — so an entrance that
    // ended at `transform: none` pinned every window and dragging did nothing.
    it('does not hold an entrance transform after it finishes', async () => {
      const calls = stubAnimate()
      await motion.windowIn(el)
      expect(calls[0].options.fill).not.toBe('both')
      expect(calls[0].options.fill).not.toBe('forwards')
    })

    // Exits are the exception: they end invisible and the element goes away.
    it('holds the final frame of an exit', async () => {
      const calls = stubAnimate()
      await motion.windowOut(el)
      await motion.popOut(el)
      await motion.fadeOut(el)
      calls.forEach((c) => expect(c.options.fill).toBe('forwards'))
    })

    it('lets callers override the defaults', async () => {
      const calls = stubAnimate()
      await play(el, [{ opacity: 0 }], { duration: 999, easing: 'linear', delay: 40 })

      expect(calls[0].options.duration).toBe(999)
      expect(calls[0].options.easing).toBe('linear')
      expect(calls[0].options.delay).toBe(40)
    })

    // Regression: animations do not advance while the document is hidden, so a
    // promise chained off `finished` never settles in a background tab. Exit
    // animations gate element removal, so that would leak the element.
    it('does not wait forever when the animation never finishes', async () => {
      vi.useFakeTimers()
      let finished = false
      ;(el as any).animate = () => ({
        // A frozen timeline: never resolves, as in a hidden tab.
        finished: new Promise(() => {}),
        playState: 'running',
        finish: () => { finished = true },
      })

      let done = false
      const running = play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 })
        .then(() => { done = true })

      await vi.advanceTimersByTimeAsync(100)
      expect(done).toBe(false)

      // Capped just past the animation's own length.
      await vi.advanceTimersByTimeAsync(200)
      await running
      expect(done).toBe(true)
      // Jumped to the end rather than cancelled, so an entrance stays visible.
      expect(finished).toBe(true)
      vi.useRealTimers()
    })

    /*
     * Regression: `finish()` does not no-op on a cancelled animation, it
     * revives it — back to "finished" and, filling forwards, overriding inline
     * styles again. A cancelled window entrance came back 80ms later and
     * pinned every window in the overview.
     */
    it('never revives an animation cancelled while the wait was still running', async () => {
      vi.useFakeTimers()
      let state = 'running'
      let finishes = 0
      const animation = {
        finished: new Promise(() => {}),
        get playState() { return state },
        finish() { finishes++; state = 'finished' },
        cancel() { state = 'idle' },
      }
      ;(el as any).animate = () => animation

      const running = play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 140 })
      animation.cancel()

      await vi.advanceTimersByTimeAsync(500)
      await running

      expect(finishes).toBe(0)
      expect(state).toBe('idle')
      vi.useRealTimers()
    })

    it('resolves via onfinish where the finished promise is unavailable', async () => {
      let handler: (() => void) | null = null
      ;(el as any).animate = () => ({
        set onfinish(fn: () => void) { handler = fn },
        set oncancel(_fn: () => void) {},
      })

      let done = false
      const running = play(el, [{ opacity: 0 }]).then(() => { done = true })

      expect(done).toBe(false)
      handler!()
      await running
      expect(done).toBe(true)
    })
  })

  describe('presets', () => {
    beforeEach(() => stubMatchMedia(false))

    // Exits should get out of the way faster than entrances arrive.
    it('leaves faster than it arrives, on a sharper curve', async () => {
      const calls = stubAnimate()
      await motion.windowIn(el)
      await motion.windowOut(el)

      const [entrance, exit] = calls
      expect(exit.options.duration).toBeLessThan(entrance.options.duration as number)
      expect(entrance.options.easing).toBe(token.standard)
      expect(exit.options.easing).toBe(token.exit)
    })

    it('animates only transform and opacity, so it stays off the main thread', async () => {
      const calls = stubAnimate()
      await motion.windowIn(el)
      await motion.popIn(el)
      await motion.chipIn(el)

      const properties = new Set(
        calls.flatMap((c) => c.keyframes.flatMap((k) => Object.keys(k))),
      )
      expect([...properties].sort()).toEqual(['opacity', 'transform'])
    })

    it('every preset ends fully visible or fully hidden', async () => {
      const calls = stubAnimate()
      await motion.windowIn(el)
      await motion.windowOut(el)

      const last = (frames: Keyframe[]) => frames[frames.length - 1]
      expect(last(calls[0].keyframes).opacity).toBe(1)
      expect(last(calls[1].keyframes).opacity).toBe(0)
    })
  })
})

/**
 * The appearance swap is the one animation here that does not go through
 * `play`: it hands the change to the browser's view transition machinery, so
 * what these check is the contract with that API — and, above all, that a
 * browser without it still applies the change.
 */
describe('swapAppearance', () => {
  let started: Array<() => void>
  let resolveReady: () => void
  let rootFrames: any[]
  let rootOptions: KeyframeAnimationOptions[]

  const stubViewTransitions = () => {
    started = []
    rootFrames = []
    rootOptions = []
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve
    })
    ;(document as any).startViewTransition = (update: () => void) => {
      started.push(update)
      update()
      return { ready, finished: Promise.resolve() }
    }
    ;(document.documentElement as any).animate = (
      keyframes: any,
      options: KeyframeAnimationOptions,
    ) => {
      rootFrames.push(keyframes)
      rootOptions.push(options)
      return { finished: Promise.resolve() }
    }
  }

  /*
   * jsdom has neither of the two APIs this rests on, which is the same pair of
   * gaps an older browser has — so stubbing them is the contract, and leaving
   * them out is the fallback path.
   */
  const stubRegisterProperty = () => {
    ;(globalThis as any).CSS = { registerProperty: () => undefined }
  }

  /** Wait for the ready/finished promise chains to settle. */
  const settle = async () => {
    for (let i = 0; i < 4; i += 1) await Promise.resolve()
  }

  beforeEach(() => {
    stubMatchMedia(false)
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
  })

  afterEach(() => {
    delete (document as any).startViewTransition
    delete (document.documentElement as any).animate
    delete (globalThis as any).CSS
    document.documentElement.classList.remove('is-revealing')
    document.documentElement.style.removeProperty('--ripple-x')
    document.documentElement.style.removeProperty('--ripple-y')
    delete (window as any).matchMedia
  })

  /*
   * The whole point of the fallback: an old browser must still end up with the
   * new theme, just without the animation.
   */
  it('applies the change when view transitions are unavailable', () => {
    const change = vi.fn()
    swapAppearance(change)
    expect(change).toHaveBeenCalledOnce()
  })

  it('applies the change when motion is reduced, without a transition', () => {
    stubViewTransitions()
    stubRegisterProperty()
    stubMatchMedia(true)

    const change = vi.fn()
    swapAppearance(change, { x: 10, y: 10 })

    expect(change).toHaveBeenCalledOnce()
    expect(started).toHaveLength(0)
    expect(document.documentElement.classList.contains('is-revealing')).toBe(false)
  })

  it('runs the change inside the transition, not before it', () => {
    stubViewTransitions()
    stubRegisterProperty()
    const change = vi.fn()
    swapAppearance(change)

    expect(started).toHaveLength(1)
    // The stub calls the callback itself; the real API calls it after taking
    // the old picture. Either way it is the transition that runs it.
    expect(change).toHaveBeenCalledOnce()
  })

  /*
   * Without a registered property the mask cannot move, so the ripple is not
   * dressed up at all — the browser's own cross-fade is left to do the work.
   */
  it('falls back to a cross-fade where the property cannot be registered', async () => {
    stubViewTransitions()

    swapAppearance(vi.fn(), { x: 40, y: 60 })
    resolveReady()
    await settle()

    expect(started).toHaveLength(1)
    expect(document.documentElement.classList.contains('is-revealing')).toBe(false)
    expect(rootFrames).toHaveLength(0)
  })

  it('ripples out of the origin it was given', async () => {
    stubViewTransitions()
    stubRegisterProperty()

    swapAppearance(vi.fn(), { x: 40, y: 60 })

    expect(document.documentElement.classList.contains('is-revealing')).toBe(true)
    const root = document.documentElement
    expect(root.style.getPropertyValue('--ripple-x')).toBe('40px')
    expect(root.style.getPropertyValue('--ripple-y')).toBe('60px')

    resolveReady()
    await settle()

    expect(rootOptions[0].pseudoElement).toBe('::view-transition-new(root)')
    expect(rootOptions[0].duration).toBe(token.sweep)
    expect(rootFrames[0]['--ripple'][0]).toBe('0px')
  })

  /*
   * `--ripple` is registered with an initial value of zero, so an animation
   * that stops applying collapses the mask and shows the old theme through for
   * the frame before the pseudo-elements are torn down. That is a visible
   * blink at the end of every swap.
   */
  it('holds the ripple open at the end', async () => {
    stubViewTransitions()
    stubRegisterProperty()

    swapAppearance(vi.fn(), { x: 40, y: 60 })
    resolveReady()
    await settle()

    expect(rootOptions[0].fill).toBe('forwards')
  })

  /*
   * One ripple, always. A change nothing on screen asked for — the operating
   * system swapping theme underneath us — comes from the screen itself rather
   * than being a different animation.
   */
  it('ripples from the middle when there is nowhere to start from', async () => {
    stubViewTransitions()
    stubRegisterProperty()

    swapAppearance(vi.fn())

    expect(document.documentElement.classList.contains('is-revealing')).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--ripple-x')).toBe('500px')
    expect(document.documentElement.style.getPropertyValue('--ripple-y')).toBe('400px')

    resolveReady()
    await settle()
    expect(rootFrames).toHaveLength(1)
  })

  /*
   * The soft band is the front of the ripple, so stopping at the far corner
   * would leave that corner half-way through the change.
   */
  it('overshoots by the width of the soft edge', async () => {
    stubViewTransitions()
    stubRegisterProperty()

    // Bottom-right corner: the furthest point is the opposite one.
    swapAppearance(vi.fn(), { x: 1000, y: 800 })
    resolveReady()
    await settle()

    const end = rootFrames[0]['--ripple'][1] as string
    expect(end).toBe(`${Math.hypot(1000, 800) + FEATHER_PX}px`)
  })

  it('stops rippling once the transition has finished', async () => {
    stubViewTransitions()
    stubRegisterProperty()
    swapAppearance(vi.fn(), { x: 10, y: 10 })
    resolveReady()
    await settle()

    expect(document.documentElement.classList.contains('is-revealing')).toBe(false)
  })
})

describe('reachFrom', () => {
  const viewport = { x: 1000, y: 800 }

  it('measures to the furthest corner, not the nearest', () => {
    expect(reachFrom({ x: 0, y: 0 }, viewport)).toBeCloseTo(Math.hypot(1000, 800))
    expect(reachFrom({ x: 1000, y: 800 }, viewport)).toBeCloseTo(Math.hypot(1000, 800))
  })

  it('is shortest from the middle', () => {
    expect(reachFrom({ x: 500, y: 400 }, viewport)).toBeCloseTo(Math.hypot(500, 400))
  })
})

describe('centreOf', () => {
  it('finds the middle of a control', () => {
    const el = document.createElement('button')
    el.getBoundingClientRect = () =>
      ({ left: 100, top: 200, width: 40, height: 20 }) as DOMRect

    expect(centreOf(el)).toEqual({ x: 120, y: 210 })
  })
})
