import { describe, it, expect } from 'vitest'
import { Download, remaining } from '../src/contents/chat/progress'

/** What the default model weighs, near enough. */
const MODEL = 800_000_000

describe('watching a download', () => {
  it('reports what has arrived', () => {
    const download = new Download(MODEL)
    expect(download.record(200_000_000, MODEL, 0).fraction).toBeCloseTo(0.25)
  })

  /*
   * The bug this exists for. The runtime counts only the files it has met, and
   * it meets the tokenizer first — so its own fraction reads 1 while the model
   * has not started arriving, and a bar drawn from it sits at 100% for several
   * minutes and then says it is starting up.
   */
  it('measures against the model, not against the files met so far', () => {
    const download = new Download(MODEL)
    // The tokenizer, complete, and nothing else known about yet.
    const { fraction, preparing } = download.record(7_000_000, 7_000_000, 0)
    expect(fraction).toBeCloseTo(0.00875)
    expect(preparing).toBe(false)
  })

  /*
   * And once the weights are announced the real total is better than the
   * estimate: it is exact, and it is what the bar should reach 100% against.
   */
  it('switches to the runtime total once that total is credible', () => {
    const download = new Download(MODEL)
    expect(download.record(393_000_000, 786_000_000, 0).fraction).toBeCloseTo(0.5)
  })

  it('never goes backwards when the denominator moves under it', () => {
    const download = new Download(MODEL)
    download.record(786_000_000, 786_000_000, 0)
    expect(download.record(786_000_000, 800_000_000, 500).fraction).toBe(1)
  })

  it('falls back to the runtime when the model has no stated size', () => {
    const download = new Download()
    expect(download.record(50, 100, 0).fraction).toBe(0.5)
  })

  /*
   * The last byte is not the end of the wait: the weights still have to be
   * read and the graph built, which on a CPU is seconds of arithmetic with
   * nothing to report.
   */
  it('knows when everything has arrived and the model is being built', () => {
    const download = new Download(MODEL)
    expect(download.record(786_000_000, 786_000_000, 0).preparing).toBe(true)
  })

  /*
   * The first seconds are the least representative part of a download —
   * connections are still opening — and a number that says four minutes and
   * then says forty seconds is worse than no number at all.
   */
  it('says nothing about time until there is enough to go on', () => {
    const download = new Download(MODEL)
    expect(download.record(0, MODEL, 0).eta).toBeUndefined()
    // Plenty downloaded, but far too soon to tell.
    expect(download.record(200_000_000, MODEL, 900).eta).toBeUndefined()

    // Long enough, but nothing has moved.
    const stalled = new Download(MODEL)
    stalled.record(40_000_000, MODEL, 0)
    expect(stalled.record(40_000_000, MODEL, 30_000).eta).toBeUndefined()
  })

  it('estimates from the rate it has seen', () => {
    const download = new Download(MODEL)
    download.record(0, MODEL, 0)
    // 80MB in four seconds is 20MB/s; 720MB left is thirty-six seconds.
    const { eta } = download.record(80_000_000, MODEL, 4_000)
    expect(eta).toBeCloseTo(36, 0)
  })

  /*
   * A connection that crawled while it opened and is fast now should be judged
   * on the fast part, so old samples stop counting.
   */
  it('forgets the distant past', () => {
    const download = new Download(MODEL)
    download.record(0, MODEL, 0)
    download.record(16_000_000, MODEL, 20_000) // crawling
    download.record(400_000_000, MODEL, 25_000)
    const { eta } = download.record(600_000_000, MODEL, 30_000) // and then quick
    // Judged on the recent stretch, not on the crawl that preceded it.
    expect(eta).toBeLessThan(20)
  })
})

/*
 * Coarse on purpose: the estimate is not accurate to the second and should not
 * pretend to be, and rounded hard it stops flickering.
 */
describe('saying how long is left', () => {
  it('speaks the way somebody waiting would', () => {
    expect(remaining(4)).toBe('a few seconds left')
    expect(remaining(38)).toBe('about 40s left')
    expect(remaining(75)).toBe('about a minute left')
    expect(remaining(200)).toBe('about 3 min left')
    expect(remaining(4_000)).toBe('several minutes left')
  })
})
