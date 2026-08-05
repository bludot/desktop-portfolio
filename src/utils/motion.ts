import { motion as token, FEATHER_PX } from "../theme";
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

interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
}

/** The class that replaces the default cross-fade with a circular reveal. */
const REVEALING = "is-revealing";

/** The point on screen a change came from, for a reveal to open out of. */
export interface Origin {
  x: number;
  y: number;
}

/** The middle of a control, for a change made by pressing one. */
export function centreOf(el: Element): Origin {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * The distance from a point to the furthest corner of the screen.
 *
 * The ripple has to reach it, or it stops short and leaves a ring of the old
 * desktop around the edge.
 */
export function reachFrom(origin: Origin, viewport: Origin): number {
  return Math.hypot(
    Math.max(origin.x, viewport.x - origin.x),
    Math.max(origin.y, viewport.y - origin.y)
  );
}

/**
 * Register the property the ripple rides on, once.
 *
 * Custom properties are strings as far as the browser is concerned, and strings
 * do not interpolate — an unregistered `--ripple` would jump from its first
 * value to its last at the halfway mark and take the gradient with it.
 * Registering it as a length is what makes it a number that can be animated.
 *
 * Returns false where the API is missing, which is the signal to fall back to
 * the browser's own cross-fade rather than to a mask that cannot move.
 */
let registered = false;
function canRipple(): boolean {
  const api = (
    globalThis as unknown as {
      CSS?: { registerProperty?: (definition: object) => void };
    }
  ).CSS;

  // Asked every time rather than remembered: the answer is a property lookup,
  // and remembering it would pin the first answer for the life of the page.
  if (typeof api?.registerProperty !== "function") return false;
  if (registered) return true;

  try {
    api.registerProperty({
      name: "--ripple",
      syntax: "<length>",
      inherits: false,
      initialValue: "0px"
    });
  } catch {
    // Already registered — the dev server evaluates this module twice on
    // reload. Registering is the only thing that must happen once.
  }

  registered = true;
  return true;
}

/**
 * Change how the desktop looks, over a moment rather than between two frames.
 *
 * A theme swap rewrites every colour token at once, so without this the whole
 * screen changes on a single frame — correct, and abrupt enough to read as a
 * glitch rather than as something you did.
 *
 * This is the one animation on the desktop that is not built on the Web
 * Animations API, because it is not animating an element: the browser is asked
 * to hold a picture of the old desktop, the tokens are rewritten underneath it,
 * and the new one spreads over the top from wherever the change was made.
 * Nothing here knows or cares which tokens changed, which is what lets the same
 * call cover a theme, an accent and a wallpaper.
 *
 * One ripple, always — not a wipe here and a dissolve there. A change with no
 * place to start from, as when the operating system swaps theme on its own,
 * opens from the middle of the screen.
 *
 * Where any of this is unavailable the change simply happens, which is exactly
 * the behaviour it replaces.
 */
export function swapAppearance(change: () => void, origin?: Origin): void {
  const doc = document as unknown as {
    startViewTransition?: (update: () => void) => ViewTransition;
  };

  if (prefersReducedMotion() || typeof doc.startViewTransition !== "function") {
    change();
    return;
  }

  const root = document.documentElement;
  // Nothing on screen asked for it, so it comes from the screen itself.
  const from = origin ?? {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };
  const rippling = canRipple();

  if (rippling) {
    root.style.setProperty("--ripple-x", `${from.x}px`);
    root.style.setProperty("--ripple-y", `${from.y}px`);
    root.classList.add(REVEALING);
  }

  /*
   * `change` runs inside the callback, and the callback runs *after* the old
   * picture has been taken — which is a frame or two from now, not on this
   * line. Anything that has to see the result of the change belongs in here
   * with it; read it out afterwards and you get the state before the swap.
   */
  const transition = doc.startViewTransition(change);

  void transition.finished
    .catch(() => undefined)
    .then(() => root.classList.remove(REVEALING));

  if (!rippling) return;

  void transition.ready
    .then(() => {
      const reach = reachFrom(from, {
        x: window.innerWidth,
        y: window.innerHeight
      });

      root.animate(
        /*
         * Overshoots by the width of the soft band, because the band is the
         * *front* of the ripple: at exactly `reach` the screen is covered by
         * the fade rather than by the new desktop, and the far corner would
         * still be part old when it stopped.
         */
        {
          "--ripple": ["0px", `${reach + FEATHER_PX}px`]
        } as unknown as PropertyIndexedKeyframes,
        {
          duration: token.sweep,
          easing: token.standard,
          /*
           * Held at the end, and this is not optional.
           *
           * `--ripple` is registered with an initial value of zero, so the
           * moment the animation stops applying, the mask collapses to nothing
           * and the new desktop vanishes — for the frame or two before the
           * pseudo-elements are torn down, the old theme shows through. That
           * is the blink: the swap appears to complete and then flash back.
           */
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    })
    .catch(() => {
      // A transition that never started is not worth reporting: the change has
      // already been applied and only the animation is missing.
      root.classList.remove(REVEALING);
    });
}

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

  /**
   * Moving between views inside a window — a list to a repository, a folder to
   * a file, one tab to another.
   *
   * Direction carries the sense of it: going deeper arrives from the right,
   * coming back from the left, which is the same grammar every phone uses. It
   * is deliberately shorter than a window entrance; this is a step, not an
   * arrival.
   */
  viewIn(el: HTMLElement, from: "right" | "left" = "right") {
    const offset = from === "right" ? 10 : -10;
    return play(
      el,
      [
        { opacity: 0, transform: `translateX(${offset}px)` },
        { opacity: 1, transform: "translateX(0)" }
      ],
      { duration: token.fast, easing: token.standard }
    );
  },

  /**
   * A context menu opening from the pointer.
   *
   * Shorter and smaller-travelled than the launcher's entrance: this one is
   * anchored to the cursor, so it should look like it grew from under it rather
   * than flew in. The caller sets `transform-origin` to the corner the menu was
   * placed from, which is what makes the scale read as growth from the point.
   */
  menuIn(el: HTMLElement) {
    return play(
      el,
      [
        { opacity: 0, transform: "scale(.94)" },
        { opacity: 1, transform: "scale(1)" }
      ],
      { duration: token.fast, easing: token.standard }
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
