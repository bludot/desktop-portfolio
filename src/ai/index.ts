/**
 * What this desktop asks of a model, and what it says when it cannot.
 *
 * The models, the vectors and the rules about what a browser-local model may
 * claim all live in `@thatcatdev/browser-ai` — none of it is about this
 * portfolio, and it was pulled out so it could be used somewhere that is not.
 * What is left here is the half that is James's: which documents there are to
 * search, where the vectors are kept, and the words the desktop uses when it
 * declines to answer.
 */
import {
  VectorIndex,
  contextual,
  ground,
  limit,
  type Document,
  type Limit
} from "@thatcatdev/browser-ai";
import { desktopStore } from "./store";
import { COMMON, aboutJames, fromRepos } from "./documents";
import type { Repo } from "../utils/github";

export { contextual, ground };
export type { Document };

/**
 * How alike is alike enough, for each of the two things this desktop searches.
 *
 * Different jobs, different tolerances: in the launcher a weak match costs
 * somebody a glance at a row they did not want, and in a prompt it becomes a
 * paragraph a model treats as true and builds on.
 */
const LAUNCHER_FLOOR = 0.28;
const PROMPT_FLOOR = 0.32;

/** The repositories, searchable by what they are rather than what they spell. */
export function repoIndex() {
  return new VectorIndex({
    store: desktopStore,
    cacheKey: "repo-embeddings",
    floor: LAUNCHER_FLOOR,
    // Names are already matched literally by the launcher; this half is meaning.
    lexicalBoost: 0
  });
}

/** Everything the chat window is allowed to know about James. */
export function knowledgeIndex() {
  return new VectorIndex({
    store: desktopStore,
    cacheKey: "knowledge-embeddings",
    floor: PROMPT_FLOOR,
    lexicalBoost: 0.25,
    stopWords: COMMON
  });
}

export { aboutJames, fromRepos };

/**
 * Whether a question is about James at all.
 *
 * Only questions about him should be told "there is nothing about that" when
 * they turn up nothing — asked to explain a monolith, the model should simply
 * answer.
 */
export function personal(question: string): boolean {
  return /\b(james|he|his|him|you|your|himself)\b/i.test(question);
}

/**
 * Things a CV cannot record, however well retrieval works.
 *
 * Asked for weaknesses, retrieval returns the *strengths* passages — they are
 * what the question is about — and the model writes plausible criticism out of
 * them. Nobody's own account of their work is where their faults are written
 * down, so this is answered from the source rather than from the man.
 */
const NOT_RECORDED =
  /\b(weakness(es)?|flaws?|shortcomings?|worst|bad at|struggle[sd]?( with)?|downsides?|criticism|dislikes?|salary|earns?|paid|how much (does|did) he (earn|make|get))\b/i;

export interface Refusal {
  answer: string;
  /** What to hand to a real search engine, when that is the right next step. */
  search?: string;
}

/**
 * What the desktop says instead of asking the model.
 *
 * The library decides *whether* to refuse and why; the words are this
 * desktop's. A portfolio should sound like its owner, not like a library.
 */
export function refuse(question: string): Refusal | undefined {
  const q = question.trim();
  if (!q) return undefined;

  if (NOT_RECORDED.test(q)) {
    return {
      answer:
        "I only have James's own notes — his roles, his projects and what he built. They don't record anything like that, so I'd be making it up."
    };
  }

  const reason: Limit | undefined = limit(q);
  if (!reason || reason === "asks-for-sources") return undefined;

  if (reason === "no-clock") {
    return {
      answer:
        "I have no clock and no calendar — the taskbar has the time, and I only see what you type."
    };
  }
  if (reason === "no-internet") {
    return {
      answer:
        "I can't search or reach the internet: I'm a model running in this browser tab with no connection of my own. The desktop can search, though.",
      search: q
    };
  }
  return {
    answer:
      "I don't know anything about the present — no internet, and my training stopped long before today. Anything I said about it would be invented.",
    search: q
  };
}

/** Whether somebody is asking where the last answer came from. */
export function asksForSources(question: string): boolean {
  return limit(question) === "asks-for-sources";
}

/** The documents the chat window searches, once the repositories are known. */
export function knowledgeDocuments(repos: Repo[]): Document[] {
  return aboutJames(repos);
}
