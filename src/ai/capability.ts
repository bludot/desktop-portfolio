/**
 * Questions the model must not be allowed to answer.
 *
 * Asked whether it could search the web, it said "Yes, I can search the web.
 * What would you like to search for?" — and then, asked what was airing,
 * invented an anime and a release date. Both times it had been told plainly in
 * its system prompt that it could do neither. At half a billion parameters an
 * instruction is a suggestion, and agreeing is the likeliest next token.
 *
 * So this is not left to the model. Anything about the live world — a search, a
 * date, the news, the weather, what is out now — is answered here, in code,
 * before a single token is generated. The answer is short, true, and hands the
 * question to something that can actually take it: the desktop's own web
 * search, which is a real link to a real search engine.
 *
 * The rules are deliberately blunt. A false positive costs somebody one honest
 * sentence and a button; a false negative is a machine that lies fluently about
 * facts nobody can check from inside a browser tab.
 */

export interface Refusal {
  /** What to say instead. One sentence, no apology. */
  answer: string;
  /** What to hand to a real search engine, when that is the right next step. */
  search?: string;
}

const LOOKUP =
  /\b(search|google|look (it |this |that )?up|browse|internet access|the web|online)\b/i;

const NOW =
  /\b(today|tonight|right now|currently|this (week|month|year)|latest|newest|recent|news|weather|price of|stock|airing|out now|release[ds]? (this|last)?)\b/i;

const SELF_TIME = /\b(what (day|date|time)|todays? date|what year)\b/i;

/**
 * Asking where the last answer came from.
 *
 * A question about the conversation rather than about James — but retrieval
 * cannot tell, so it fired on it, handed over the same notes again, and the
 * model dutifully repeated the previous answer instead of sourcing it. The
 * window knows what it used; it should just say.
 */
const SOURCES =
  /\b(based on|where (did|do) (you|that) (get|come)|what.{0,12}(source|sources)|how do you know|says who)\b/i;

export function asksForSources(question: string): boolean {
  return SOURCES.test(question.trim());
}

/**
 * Whether this is a question the window should answer for itself.
 *
 * Returns nothing for anything the model can honestly attempt — which is most
 * things, including everything about James, since that arrives as retrieved
 * notes rather than as recall.
 */
/**
 * Asking the notes for something they do not contain by construction.
 *
 * Weaknesses, flaws, what he is bad at — a CV and a list of projects record
 * none of that, and retrieval cannot say so: asked for weaknesses it returns
 * the *strengths* passages, because they are what the question is about, and
 * the model then produces a paragraph of plausible invented criticism from
 * them. ("His proficiency in Node.js could be a strength, but it also means he
 * needs to develop additional skills in more niche languages.")
 *
 * The honest answer is about the source rather than the man: these notes are
 * his own account of his work, and anybody's own account is not where their
 * faults are written down.
 */
const NOT_RECORDED =
  /\b(weakness(es)?|flaws?|shortcomings?|worst|bad at|struggle[sd]?( with)?|downsides?|criticism|dislikes?|salary|earns?|earn|paid|how much (does|did) he (earn|make|get))\b/i;

export function refuse(question: string): Refusal | undefined {
  const q = question.trim();
  if (!q) return undefined;

  if (NOT_RECORDED.test(q)) {
    return {
      answer:
        "I only have James's own notes — his roles, his projects and what he built. They don't record anything like that, so I'd be making it up."
    };
  }

  if (SELF_TIME.test(q)) {
    return {
      answer:
        "I have no clock and no calendar — the taskbar has the time, and I only see what you type."
    };
  }

  if (LOOKUP.test(q)) {
    return {
      answer:
        "I can't search or reach the internet: I'm a model running in this browser tab with no connection of my own. The desktop can search, though.",
      search: q
    };
  }

  if (NOW.test(q)) {
    return {
      answer:
        "I don't know anything about the present — no internet, and my training stopped long before today. Anything I said about it would be invented.",
      search: q
    };
  }

  return undefined;
}
