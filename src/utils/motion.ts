import { motion as token } from "../theme";
import appearance from "./appearance";

/**
 * A very small motion layer for the desktop.
 *
 * Built on the Web Animations API rather than a library or hand-rolled
 * requestAnimationFrame loops: transform and opacity animations run on the
 * compositor, every animation is cancellable, and each one hands back a promise
 * so callers can wait for an exit before tearing the element down.
 *
 * Three things are handled centrally so no caller has to remember them:
 *
 *   - `prefers-reduced-motion` short-circuits every animation to a no-op that
 *     still resolves, so awaiting code behaves identically either way.
 *   - Environments without the Web Animations API (older browsers, jsdom)
 *     resolve immediately instead of throwing.
 *   - Durations and easings come from the theme, so motion is tokenised the
 *     same way colour and type are.
 */

/** Grace beyond an animation's own length before the wait is cut short. */
const SETTLE_MARGIN_MS = 80;

export interface PlayOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  fill?: FillMode;
}

/**
 * True when the viewer has asked for less movement — either in Settings, or in
 * the operating system. The setting can only ever add to what the OS asks for:
 * turning it off here does not override someone who has asked their system for
 * reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (appearance.get().reduceMotion) return true;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Drop every animation on an element, handing its styling back to the cascade.
 *
 * A filled animation keeps applying its final keyframe and outranks inline
 * styles, so anything that writes `style.transform` afterwards — dragging a
 * window, restoring it from the overview — silently does nothing until the
 * animation is gone.
 */
export function clearAnimations(el: HTMLElement): void {
  if (typeof el.getAnimations !== "function") return;
  el.getAnimations().forEach((animation) => animation.cancel());
}

const canAnimate = (el: Element): boolean =>
  typeof (el as HTMLElement).animate === "function";

/**
 * Play keyframes and resolve when they finish.
 *
 * Resolves immediately — without touching the element — when motion is reduced
 * or unavailable, so `await` sites need no branching of their own.
 */
export function play(
  el: HTMLElement,
  keyframes: Keyframe[],
  options: PlayOptions = {}
): Promise<void> {
  if (prefersReducedMotion() || !canAnimate(el)) return Promise.resolve();

  const duration = options.duration ?? token.base;
  const delay = options.delay ?? 0;

  /*
   * Supersede whatever was already on this element.
   *
   * Components reuse their elements — the launcher unloads and reloads the same
   * node — so a filled-forwards exit is still applying `opacity: 0` when the
   * next entrance starts. The entrance wins while it runs and then stops
   * applying, handing the element straight back to the old exit: open, close,
   * open, and the third one comes back invisible.
   */
  clearAnimations(el);

  const animation = el.animate(keyframes, {
    duration,
    easing: options.easing ?? token.standard,
    delay,
    /*
     * `backwards`, not `both`.
     *
     * A filled-forwards animation keeps applying its last keyframe after it
     * finishes, and animation values outrank inline styles in the cascade. An
     * entrance ending at `transform: translateY(0) scale(1)` therefore pinned
     * every window in place: dragging wrote `style.transform` and nothing
     * moved. Entrances end at the element's natural state anyway, so there is
     * nothing worth holding. Exits still ask for `forwards` explicitly — they
     * end invisible, and the element is torn down immediately after.
     */
    fill: options.fill ?? "backwards"
  });

  // `finished` is the modern surface; onfinish covers older implementations.
  const finished: Promise<void> = animation.finished
    ? animation.finished.then(
        () => undefined,
        () => undefined
      )
    : new Promise((resolve) => {
        animation.onfinish = () => resolve();
        animation.oncancel = () => resolve();
      });

  /*
   * Never wait forever.
   *
   * Animations do not advance while the document is hidden — the timeline is
   * frozen — so a promise chained off `finished` never settles in a background
   * tab. Anything awaiting an exit before removing an element would leak it: a
   * launcher left open, a closed window never unloaded.
   *
   * So the wait is capped just past the animation's own length. If the cap wins
   * the animation is jumped to its end rather than cancelled, since cancelling
   * would revert an entrance to invisible.
   */
  let timer: ReturnType<typeof setTimeout> | undefined;
  const capped = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      /*
       * Only ever nudge an animation that is still pending.
       *
       * `finish()` does not no-op on a cancelled animation — it revives it.
       * The animation goes back to "finished" and, filling forwards, resumes
       * overriding inline styles for good. That is how a cancelled window
       * entrance came back 80ms later and pinned every window in the overview,
       * so panning wrote transforms that never took effect.
       */
      const state = animation.playState;
      if (state === "running" || state === "paused") {
        try {
          animation.finish();
        } catch {
          // Nothing to finish; the caller only cares that the wait is over.
        }
      }
      resolve();
    }, duration + delay + SETTLE_MARGIN_MS);
  });

  // Whichever wins, the timer must not outlive the wait.
  return Promise.race([finished, capped]).then(() => {
    clearTimeout(timer);
  });
}

/**
 * Named movements, so components describe intent rather than keyframes and the
 * desktop moves consistently.
 */
export const motion = {
  /** A window arriving: rises and settles rather than appearing. */
  windowIn(el: HTMLElement) {
    return play(
      el,
      [
        { opacity: 0, transform: "translateY(8px) scale(.985)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ],
      { duration: token.base, easing: token.standard }
    );
  },

  /** A window leaving. Quicker than arriving, and eased out rather than in. */
  windowOut(el: HTMLElement) {
    return play(
      el,
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(4px) scale(.98)" }
      ],
      { duration: token.fast, easing: token.exit, fill: "forwards" }
    );
  },

  /** The launcher, hinged from the taskbar it grew out of. */
  popIn(el: HTMLElement) {
    return play(
      el,
      [
        { opacity: 0, transform: "translateY(10px) scale(.97)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ],
      { duration: token.base, easing: token.standard }
    );
  },

  popOut(el: HTMLElement) {
    return play(
      el,
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(6px) scale(.98)" }
      ],
      { duration: token.fast, easing: token.exit, fill: "forwards" }
    );
  },

  /** A taskbar chip appearing as its window opens. */
  chipIn(el: HTMLElement) {
    return play(
      el,
      [
        { opacity: 0, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: token.fast, easing: token.standard }
    );
  },

  fadeIn(el: HTMLElement, options?: PlayOptions) {
    return play(el, [{ opacity: 0 }, { opacity: 1 }], options);
  },

  fadeOut(el: HTMLElement, options?: PlayOptions) {
    return play(el, [{ opacity: 1 }, { opacity: 0 }], {
      easing: token.exit,
      fill: "forwards",
      ...options
    });
  }
};

export default motion;
