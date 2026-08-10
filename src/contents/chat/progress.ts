/**
 * How far a download has got, and how much longer it has.
 *
 * The hard part is not the arithmetic, it is the denominator. What the runtime
 * reports is the bytes of the files *it has met so far*, and it meets them in
 * the order it needs them: a couple of small JSON files, and then — a second or
 * two later — the weights, which are the entire download. Taken at face value
 * that reads 98% before a byte of the model has arrived, sits there for several
 * minutes, and then says it is starting up. Which is exactly what it looked
 * like.
 *
 * So the model's own size is the denominator until the runtime has admitted to
 * something comparable, and everything else — the bar, the percentage, the
 * estimate — is measured against that instead.
 */

/** Samples older than this stop counting towards the rate. */
const WINDOW = 12_000;

/**
 * How long before an estimate is worth making.
 *
 * The first seconds of a download are the least representative part of it —
 * connections are still opening, and headers arrive before bodies. An estimate
 * made there is out by an order of magnitude, and a number that says four
 * minutes and then says forty seconds is worse than no number at all.
 */
const SETTLE = 2_500;
const ENOUGH = 500_000;

/**
 * When to believe the runtime's own total instead of the model's stated size.
 *
 * The weights are the overwhelming majority of any of these downloads, so once
 * the total on offer is within sight of what the model is supposed to weigh,
 * the big file has been announced and the real figure is better than the
 * estimate — it is exact, and it is what the bar should reach 100% against.
 */
const CREDIBLE = 0.6;

export interface Progress {
  /** Fraction downloaded, 0 to 1. Never smaller than it was last time. */
  fraction: number;
  /** Seconds left, once there is enough of a download to say. */
  eta?: number;
  /** Every byte is in, and what remains is the model being built. */
  preparing: boolean;
}

export class Download {
  private highest = 0;
  private readonly seen: Array<{ at: number; loaded: number }> = [];

  /**
   * @param expected What the chosen model weighs, near enough. Zero if unknown,
   *   in which case the runtime's total is all there is to go on.
   */
  constructor(private readonly expected = 0) {}

  record(loaded: number, total: number, now: number = Date.now()): Progress {
    const against = this.denominator(total);
    this.seen.push({ at: now, loaded });

    // Only the recent past predicts the near future: a download that crawled
    // while the connection opened and is fast now should be judged on the fast
    // part.
    while (this.seen.length > 2 && now - this.seen[0].at > WINDOW) this.seen.shift();

    /*
     * Clamped to the highest seen, because the denominator does move: the
     * moment the weights are announced, the true total replaces the estimate.
     * A bar that goes backwards reads as a fault, so this one stalls instead.
     */
    this.highest = Math.max(
      this.highest,
      against ? Math.min(1, loaded / against) : 0
    );

    return {
      fraction: this.highest,
      eta: this.estimate(loaded, against, now),
      preparing: against > 0 && loaded >= against
    };
  }

  private denominator(total: number): number {
    if (!this.expected) return total;
    // Before the weights are announced the runtime's total is a tokenizer, and
    // measuring against it is what produced 98%-then-nothing.
    return total >= this.expected * CREDIBLE ? total : Math.max(this.expected, total);
  }

  private estimate(loaded: number, against: number, now: number): number | undefined {
    const first = this.seen[0];
    if (!first || !against) return undefined;

    const elapsed = now - first.at;
    const covered = loaded - first.loaded;
    if (elapsed < SETTLE || covered < ENOUGH) return undefined;

    // Bytes per second, which is a real rate — a rate of *fractions* would be
    // distorted every time the denominator changed underneath it.
    const rate = covered / (elapsed / 1000);
    if (rate <= 0) return undefined;
    return Math.max(0, against - loaded) / rate;
  }
}

/**
 * Seconds, said the way somebody waiting would say them.
 *
 * Coarse on purpose. The estimate is not accurate to the second and should not
 * pretend to be — and rounded hard it also stops flickering, which is most of
 * what makes a countdown feel unreliable. Anything long enough to walk away
 * from is left vague, because by then the exact figure has stopped being the
 * point.
 */
export function remaining(seconds: number): string {
  if (seconds < 10) return "a few seconds left";
  if (seconds < 60) return `about ${Math.round(seconds / 10) * 10}s left`;
  if (seconds < 90) return "about a minute left";
  if (seconds < 600) return `about ${Math.round(seconds / 60)} min left`;
  return "several minutes left";
}
