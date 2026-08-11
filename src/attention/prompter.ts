/**
 * The thing that decides whether to say anything at all.
 *
 * The rules say what *could* be offered; this says whether it should be, and
 * the answer is usually no. Every limit here exists because the failure mode of
 * a feature like this is not being unhelpful — it is being present. A desktop
 * that offers a tip every thirty seconds has stopped being a desktop and become
 * a thing you are trying to get away from.
 *
 * So: one at a time, never twice, a long silence between, a hard cap for the
 * visit, and nothing at all in the first half minute. If those seem
 * conservative, that is the point — the version of this that is too quiet is a
 * feature nobody notices, and the version that is too loud is a page people
 * leave.
 */
import Toast from "../components/Toast";
import * as processes from "../processes";
import { activity, forget, onChange, watch } from "./index";
import { suggest, type Suggestion, type Surroundings } from "./suggestions";

/** No more than this in one visit, however long somebody stays. */
const MOST_PER_VISIT = 2;

/** And this long between them. */
const QUIET_MS = 120_000;

interface Prompter {
  stop: () => void;
  /** How many have been offered, for the table to report. */
  said: () => number;
}

export interface PrompterOptions extends Surroundings {
  /** Where the toast mounts. The desktop, in practice. */
  host: HTMLElement;
}

export const ATTENTION_PROCESS = "attention";

/**
 * Start noticing, as something that shows up in the table.
 *
 * A process rather than a quiet subscription, and the reason is not tidiness.
 * Something that watches what you are doing should be visible and stoppable by
 * the person it is watching — the Processes window lists it, says what it has
 * noticed, and has a button that ends it. A feature like this that could only
 * be discovered by reading the source would be worth less than not having it.
 *
 * It shares the model with the chat window rather than having one of its own:
 * `modelWarm` asks the register whether one is up and never asks for one. Two
 * things wanting the same model get the same model, which is what the register
 * is for.
 */
export function start(options: PrompterOptions): void {
  processes.ensure<Prompter>({
    name: ATTENTION_PROCESS,
    label: "Attention",
    detail: () => {
      const seen = activity();
      const opens = [...seen.opened.values()].reduce((sum, n) => sum + n, 0);
      const offered = running?.said() ?? 0;
      return `${opens} window${opens === 1 ? "" : "s"} opened · ${offered} offered`;
    },
    start: () => {
      watch();
      running = prompt(options);
      return running;
    },
    /*
     * Killing it means killing it: the toast goes, the subscription goes, and
     * what it had noticed is forgotten rather than left in memory for a
     * restart to pick up. Somebody who ends this has said what they meant.
     */
    stop: (prompter) => {
      prompter.stop();
      forget();
      running = undefined;
    }
  });
}

/*
 * The one that is running, so the table can ask it what it has done.
 *
 * Tied to the process rather than to the module: `start` sets it and `stop`
 * clears it. A counter kept at module scope instead would be shared by every
 * prompter ever built, which is wrong in the same way a global always is —
 * and, in a test suite, wrong loudly.
 */
let running: Prompter | undefined;

export function prompt(options: PrompterOptions): Prompter {
  /*
   * Spent, not shown.
   *
   * A suggestion is used up whether it was taken or dismissed, and both for the
   * same reason: the visitor has now answered it. Offering the launcher again
   * to somebody who just declined it is how a suggestion becomes nagging.
   */
  const spent = new Set<string>();
  let showing: Toast | undefined;
  let said = 0;
  let lastAt = 0;
  let stopped = false;

  const consider = () => {
    if (stopped || showing || said >= MOST_PER_VISIT) return;
    if (lastAt && Date.now() - lastAt < QUIET_MS) return;

    const found: Suggestion | undefined = suggest(activity(), options, spent);
    if (!found) return;

    spent.add(found.id);
    said += 1;
    lastAt = Date.now();

    const toast = new Toast({
      text: found.text,
      action: found.action,
      onGone: () => {
        showing = undefined;
      }
    });
    showing = toast;
    void toast.load(options.host);
  };

  const unwatch = onChange(consider);

  /*
   * Rules that turn on time rather than on an event need something to wake
   * them: "has been here ninety seconds and never opened the chat" is true at a
   * moment when, by definition, nothing happened. Slow on purpose — this is a
   * check, not a loop, and there is nothing here worth a frame.
   */
  const tick = setInterval(consider, 15_000);

  return {
    said: () => said,
    stop: () => {
      stopped = true;
      unwatch();
      clearInterval(tick);
      void showing?.leave();
    }
  };
}
