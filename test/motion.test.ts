import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { play, motion, prefersReducedMotion } from '../src/utils/motion'
import { motion as token } from '../src/theme'

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
