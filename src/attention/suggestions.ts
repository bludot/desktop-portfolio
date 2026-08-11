/**
 * The few things worth saying, and when they are worth saying.
 *
 * Hand-written, and deliberately so. Every one of these is a sentence somebody
 * would say to a visitor standing next to them — "there's a search, you know" —
 * and a rule that fires when the visitor has plainly gone looking for it. No
 * model is involved in deciding, and none needs to be: the signal is three
 * window events, and a 0.5B model asked to interpret three window events would
 * be a slower way to reach the same answer with room to be wrong.
 *
 * Where the model does earn a place is the last one, and only when it is
 * already running. Nothing here will ever start a download to make a
 * suggestion — an unsolicited tip is not worth a megabyte, let alone eight
 * hundred.
 *
 * The bar for adding one: it has to be *useful when it fires* and *silent
 * otherwise*. A desktop that offers help constantly is not helpful, it is
 * nervous.
 */
import type { Activity } from "./index";

export interface Suggestion {
  /** Stable, so a dismissal can be remembered against it. */
  id: string;
  /** What the toast says. One sentence, no exclamation marks. */
  text: string;
  /** What the button does, and what it is called. */
  action: { label: string; run: () => void };
}

export interface Surroundings {
  /**
   * Whether a chat model is already up — asked at the moment it matters.
   *
   * A function rather than a value: a visitor may open the chat at any point,
   * and a boolean read once at startup would be answering about a desktop that
   * no longer exists. Never a reason to start one.
   */
  modelWarm: () => boolean;
  /** Open the launcher, which is where searching happens. */
  openLauncher: () => void;
  /** Open the chat window. */
  openChat: () => void;
}

interface Rule {
  id: string;
  when: (activity: Activity, around: Surroundings) => boolean;
  build: (around: Surroundings) => Omit<Suggestion, "id">;
}

const times = (counts: ReadonlyMap<string, number>, title: string) =>
  counts.get(title) ?? 0;

/**
 * Long enough that nobody is interrupted while they are still arriving.
 *
 * The first seconds of a visit are the worst possible moment: the windows are
 * still animating in, the visitor has not read anything yet, and anything that
 * appears reads as a cookie banner.
 */
const SETTLE_IN = 25;

export const RULES: Rule[] = [
  /*
   * Opened the repositories, closed them, opened them again.
   *
   * That is somebody scanning a list for one thing rather than browsing it, and
   * the launcher is the answer they have not found — it searches every
   * repository by name, and by meaning when that is switched on.
   */
  {
    id: "search-instead-of-scrolling",
    when: (a) =>
      a.seconds > SETTLE_IN &&
      times(a.opened, "Projects") >= 2 &&
      times(a.closed, "Projects") >= 1,
    build: (around) => ({
      text: "Looking for something in particular? The launcher searches every repository by name.",
      action: { label: "Open it", run: around.openLauncher }
    })
  },

  /*
   * Been here a while, opened a few things, never found the chat.
   *
   * The one window on this desktop somebody is unlikely to guess at, and the
   * one worth guessing at: it answers questions about James from notes, using a
   * model that runs on the visitor's own machine. It is behind a `beta` tag
   * rather than a flag now, which makes it findable and still easy to miss.
   */
  {
    id: "there-is-a-model-here",
    when: (a) =>
      a.seconds > 90 &&
      a.opened.size >= 2 &&
      times(a.opened, "Chat") === 0,
    build: (around) => ({
      text: "There is a chat window here that runs a small language model on your own machine — nothing you type leaves the tab.",
      action: { label: "Try it", run: around.openChat }
    })
  },

  /*
   * The model is already up and the visitor is reading about his work.
   *
   * Only offered when the weights are loaded — see `modelWarm`. Asking someone
   * whether they would like to ask a question, and having the answer be a five
   * second wait, is worse than not asking.
   */
  {
    id: "ask-what-you-are-reading-about",
    when: (a, around) =>
      around.modelWarm() &&
      a.seconds > SETTLE_IN &&
      times(a.opened, "Experience") >= 1 &&
      times(a.opened, "Chat") === 0,
    build: (around) => ({
      text: "The model is already loaded, if you would rather ask about any of this than read it.",
      action: { label: "Ask it", run: around.openChat }
    })
  }
];

/**
 * The first rule that fires and has not been used up.
 *
 * First rather than best: with a handful of rules, ranking is a way of being
 * wrong more elaborately. They are written in the order they deserve to win.
 */
export function suggest(
  activity: Activity,
  around: Surroundings,
  spent: ReadonlySet<string>
): Suggestion | undefined {
  const rule = RULES.find(
    (candidate) => !spent.has(candidate.id) && candidate.when(activity, around)
  );
  return rule ? { id: rule.id, ...rule.build(around) } : undefined;
}
