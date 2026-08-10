/**
 * Questions worth asking, for anybody looking at an empty box.
 *
 * An empty chat window asks somebody to think of something, which is a worse
 * first impression than it sounds: most people type "hi", get a greeting back,
 * and close it. These are the questions this particular model can actually
 * answer well — every one of them lands on a passage that exists, because a
 * suggested question that gets "I don't have anything about that" is worse than
 * no suggestion at all.
 *
 * Fixed, not generated. A 0.5B model asked what to ask next writes plausible
 * questions about a James it has invented.
 */

export interface Suggestion {
  text: string;
  /**
   * What it is about, matched against the sources an answer cited.
   *
   * It is how a follow-up knows to dig in rather than change the subject: an
   * answer that came from the GoTu passages should be followed by the other
   * things worth knowing about GoTu.
   */
  about?: string[];
}

export const SUGGESTIONS: Suggestion[] = [
  { text: "What does James do?", about: ["About"] },
  { text: "Where has he worked?" },
  { text: "What did he do at GoTu?", about: ["GoTu"] },
  { text: "How did he move GoTu off its monolith?", about: ["GoTu"] },
  { text: "What did he build at Honest?", about: ["Honest"] },
  { text: "Has he worked on payments?", about: ["Honest"] },
  { text: "What does he use Kubernetes for?", about: ["GoTu", "Honest"] },
  { text: "How much does he write in Go?", about: ["GitHub", "Honest"] },
  { text: "What has he open sourced?", about: ["GitHub"] },
  { text: "What is this desktop written in?", about: ["About"] },
  { text: "Where is he based?", about: ["About"] }
];

/** How many to show at once. Enough to choose from, few enough to read. */
export const SHOWN = 3;

/**
 * How many of those the model may have written.
 *
 * Never all of them. A question it invents is only offered after it has been
 * checked against the notes — see `answerable` in the chat window — but the
 * check can only prove that something *related* exists, not that the question
 * is a sensible one. Keeping a written-down question in the row means the offer
 * is never entirely at the mercy of a 0.5B model having a bad turn.
 */
export const MADE_UP = 2;

/** The longest a suggested question may be before it stops being a chip. */
const LONGEST = 72;

/**
 * The questions in whatever the model wrote back.
 *
 * Asked for two questions it will sometimes write three, number them, wrap them
 * in quotes, or introduce them — "Here are some questions you might ask:". So
 * nothing is trusted except lines that end in a question mark, and even those
 * get their decoration taken off.
 */
export function parseQuestions(text: string, limit = MADE_UP): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  text.split(/\n+/).forEach((line) => {
    const cleaned = line
      // Numbering, bullets, and the quotes it likes to wrap them in.
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
      .replace(/^["“']|["”']$/g, "")
      .trim();

    if (!cleaned.endsWith("?") || cleaned.length > LONGEST) return;
    // A question of two words is a fragment, not a question.
    if (cleaned.split(/\s+/).length < 3) return;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    if (out.length < limit) out.push(cleaned);
  });

  return out;
}

/**
 * The next few to offer.
 *
 * Anything already asked is gone for good — repeating a question somebody has
 * just had answered is the tell that these are a list and not a conversation.
 * What is left is sorted by whether it belongs to what was just being
 * discussed, so the follow-ups under an answer about GoTu are about GoTu.
 */
export function suggest(
  asked: ReadonlySet<string>,
  sources: readonly string[] = [],
  count = SHOWN,
  /** Whatever the model came up with, already checked against the notes. */
  made: readonly string[] = []
): string[] {
  /*
   * The model's first, when it has any: they are about the answer that was
   * just given, which is a better follow-up than anything a fixed list can
   * be. Never more than `MADE_UP` of them, so a bad turn cannot empty the row
   * of questions somebody thought about.
   */
  const fresh = made
    .filter((question) => !asked.has(question))
    .slice(0, Math.min(MADE_UP, count));
  const room = count - fresh.length;
  if (room <= 0) return fresh;

  const already = new Set(fresh.map((question) => question.toLowerCase()));
  const related = (suggestion: Suggestion) =>
    suggestion.about?.some((topic) =>
      sources.some((source) => source.toLowerCase().includes(topic.toLowerCase()))
    ) ?? false;

  const written = SUGGESTIONS.filter(
    (suggestion) =>
      !asked.has(suggestion.text) && !already.has(suggestion.text.toLowerCase())
  )
    /*
     * A stable sort, so everything that is not about the last answer keeps the
     * order it was written in — which is roughly the order somebody meeting
     * this desktop would want them.
     */
    .sort((a, b) => Number(related(b)) - Number(related(a)))
    .slice(0, room)
    .map((suggestion) => suggestion.text);

  return [...fresh, ...written];
}
