import { embedder, similarity, type Embedder, type Progress } from "./engine";
import { readCache, writeCache } from "../Store";
import experience from "../contents/experience/data";
import { loadRepos, type Repo } from "../utils/github";
import Logger from "../Logger";

/**
 * What the model is allowed to know about James.
 *
 * Asked anything about him unaided, a half-billion-parameter model answers
 * fluently and wrongly — it has never heard of him, and a model that size does
 * not know that it has not. Training it on this material would not fix that:
 * fine-tuning teaches a voice, not a fact, and the invented job titles would
 * simply arrive in a more convincing tone.
 *
 * So nothing is trained. The real sentences are kept here, the ones that answer
 * the question are found by meaning, and they are handed to the model with the
 * question — which turns it from something being asked to recall into something
 * being asked to paraphrase, and paraphrasing is the one thing it is reliably
 * good at.
 *
 * It costs nothing to keep current, either: the repositories come from the same
 * GitHub read the Projects window uses, so a repository pushed this morning is
 * answerable this afternoon without anybody retraining anything.
 */

const CACHE_KEY = "knowledge-embeddings";

/**
 * How close a passage has to be before it is worth handing over.
 *
 * Higher than the launcher's floor. There, a weak match costs somebody a glance
 * at a row they did not want; here it becomes a paragraph the model treats as
 * true and builds on.
 */
const FLOOR = 0.32;

/** How much is put in front of the question. Four short passages is a paragraph. */
const PASSAGES = 4;

/**
 * Words too ordinary to be evidence of anything.
 *
 * Only what turns up in a question — "what did James do at GoTu" should be
 * ranked on "gotu", not on "james", which is in every passage there is.
 */
const COMMON = new Set([
  "what",
  "when",
  "where",
  "which",
  "does",
  "done",
  "james",
  "your",
  "about",
  "with",
  "have",
  "work",
  "worked",
  "tell",
  "there",
  "this",
  "that",
  "they",
  "them",
  "from",
  "into"
]);

export interface Passage {
  id: string;
  /** Where it came from, so an answer can say. */
  source: string;
  text: string;
}

/**
 * The desktop's own facts, as passages worth retrieving.
 *
 * One per role rather than one per bullet: a bullet on its own loses the job it
 * belongs to, and "led the transition from a monolith" is not much use without
 * the company and the year attached.
 */
export function passages(repos: Repo[]): Passage[] {
  const out: Passage[] = [];

  // `start` and `end` are typed loosely enough to be either; a role still
  // running has no end at all.
  const year = (at: string | Date | undefined): string =>
    at ? String(new Date(at).getFullYear()) : "present";

  /*
   * A role becomes several passages, not one.
   *
   * Nine bullets in a single passage average out into a vector about nothing in
   * particular — asked what James did at GoTu, retrieval preferred the short
   * "senior software engineer" line from About, because it was *tighter* on the
   * question even though it knew nothing about GoTu. Split up, each piece of
   * work has its own vector and can win on its own merits.
   *
   * Every piece carries the company and the position, because a bullet without
   * them is unattributable: "led the transition from a monolith" is a fact
   * about somebody's career only if you know whose and where.
   */
  experience.forEach((role, i) => {
    const years = `${year(role.start)}–${year(role.end)}`;
    const at = `${role.position} at ${role.company}`;

    out.push({
      id: `role:${i}`,
      source: at,
      text: `James worked as ${role.position} at ${role.company} in ${role.location} from ${years}. ${role.description[0] ?? ""}`
    });

    role.description.slice(1).forEach((line, j) => {
      out.push({
        id: `role:${i}:${j}`,
        source: at,
        text: `As ${at} (${years}), James ${line.charAt(0).toLowerCase()}${line.slice(1)}`
      });
    });
  });

  out.push({
    id: "about:who",
    source: "About",
    text: "James is a senior software engineer. He works mainly in Go, TypeScript and Node.js, with GraphQL and Kafka; on the data side PostgreSQL, MongoDB, Redis and Elasticsearch; and on the platform side Kubernetes, Docker, Terraform, ArgoCD, Helm, AWS, GCP and Datadog. He is based in Fort Lauderdale, Florida."
  });

  out.push({
    id: "about:desktop",
    source: "About",
    text: "This desktop is James's portfolio, written without a framework — the windows, taskbar, launcher and theming are all his own. It revisits an idea he first built years ago in PHP and jQuery, rebuilt with what he has learned since."
  });

  /*
   * Repositories, in bundles rather than one passage each.
   *
   * Eighty-eight one-line passages would crowd out the roles at retrieval time
   * on any query mentioning a language, and no single repository line is worth
   * a slot of its own. Grouped by owner they answer the question actually being
   * asked — "what has he built with X" — in one passage.
   */
  const byOwner = new Map<string, Repo[]>();
  repos.forEach((repo) => {
    const owned = byOwner.get(repo.owner) ?? [];
    owned.push(repo);
    byOwner.set(repo.owner, owned);
  });

  byOwner.forEach((owned, owner) => {
    const described = owned.filter((repo) => repo.description).slice(0, 20);
    if (!described.length) return;
    out.push({
      id: `repos:${owner}`,
      source: `${owner} on GitHub`,
      text: `Projects under ${owner}: ${described
        .map(
          (repo) =>
            `${repo.name}${repo.language ? ` (${repo.language})` : ""} — ${repo.description}`
        )
        .join("; ")}.`
    });
  });

  return out;
}

interface Stored {
  fingerprint: string;
  vectors: Record<string, number[]>;
}

/**
 * The passages, as vectors, with a question answered against them.
 *
 * Shares the launcher's embedder — the same 23MB already fetched for searching
 * projects — so turning this on costs a visitor nothing they have not already
 * paid for.
 */
export class Knowledge {
  private readonly logger = new Logger("Knowledge");
  private readonly vectors = new Map<string, Float32Array>();
  private items: Passage[] = [];
  private building?: Promise<void>;

  constructor(private readonly model: Embedder = embedder()) {}

  get ready(): boolean {
    return this.vectors.size > 0;
  }

  /**
   * Gather what there is to know, and learn it.
   *
   * The repositories are optional: GitHub may be unreachable, or the window may
   * be opened before the launcher has ever asked. Everything about James's own
   * history is local either way, so the useful half of this never depends on
   * the network.
   */
  build(onProgress?: Progress): Promise<void> {
    if (this.building) return this.building;
    this.building = this.fill(onProgress)
      .then(() => this.logger.debug(`learned ${this.vectors.size} passages`))
      .catch((error) => {
        this.logger.debug(`could not learn anything: ${error}`);
        // Nothing retrieved means nothing added to the prompt: the window
        // falls back to a model answering from its own head, which is what it
        // did before this existed.
        this.vectors.clear();
      });
    return this.building;
  }

  private async fill(onProgress?: Progress) {
    let repos: Repo[] = [];
    try {
      repos = (await loadRepos()).repos;
    } catch {
      // Answerable without them, just not about the code.
    }

    this.items = passages(repos);
    const fingerprint = this.items.map((item) => item.id).join("|");

    /*
     * The model comes in even when the vectors do not.
     *
     * Cached vectors answer "what does the corpus mean"; they cannot answer
     * "what does this question mean", and that needs the model at query time.
     * Loading it only on the miss left the second visit — every visit after the
     * first — with a full index and no way to ask it anything: `embed` threw,
     * the catch swallowed it, and searching silently returned nothing at all.
     */
    await this.model.load(onProgress);

    const stored = await readCache<Stored>(CACHE_KEY);
    if (stored?.value?.fingerprint === fingerprint) {
      Object.entries(stored.value.vectors).forEach(([id, vector]) =>
        this.vectors.set(id, Float32Array.from(vector))
      );
      return;
    }

    const vectors = await this.model.embed(this.items.map((item) => item.text));
    this.items.forEach((item, i) => this.vectors.set(item.id, vectors[i]));

    await writeCache(CACHE_KEY, {
      fingerprint,
      vectors: Object.fromEntries(
        this.items.map((item, i) => [item.id, Array.from(vectors[i])])
      )
    } satisfies Stored);
  }

  /** The passages worth putting in front of a question, best first. */
  async find(question: string, limit = PASSAGES): Promise<Passage[]> {
    const q = question.trim();
    if (!this.ready || q.length < 3) return [];

    let vector: Float32Array;
    try {
      [vector] = await this.model.embed([q]);
    } catch {
      return [];
    }

    /*
     * Meaning, plus a nudge for the words themselves.
     *
     * Sentence embeddings are weak on proper nouns — "GoTu" and "Taskworld" are
     * rare tokens carrying almost no meaning, so a question naming one scored
     * no better against that employer than against any other. A small bonus for
     * the query's own uncommon words appearing in a passage fixes exactly that,
     * without turning the whole thing back into keyword search: it is a nudge,
     * not the ranking.
     */
    const terms = q
      .toLowerCase()
      .split(/[^a-z0-9.+#-]+/)
      .filter((term) => term.length >= 4 && !COMMON.has(term));

    return this.items
      .map((item) => {
        const lower = item.text.toLowerCase();
        const hits = terms.filter((term) => lower.includes(term)).length;
        const lexical = terms.length ? (hits / terms.length) * 0.25 : 0;
        return {
          item,
          score:
            similarity(vector, this.vectors.get(item.id) ?? new Float32Array()) +
            lexical
        };
      })
      .filter((match) => match.score >= FLOOR)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((match) => match.item);
  }
}

/**
 * The question, with what is known about it above it.
 *
 * Everything is stated as material to answer *from*, and the instruction to
 * stay inside it is repeated here rather than left to the system prompt — at
 * this size the nearest instruction is the one that gets followed.
 */
export function ground(question: string, found: Passage[]): string {
  if (!found.length) return question;

  /*
   * Notes first, then the question, and no prohibitions in between.
   *
   * The first version opened with "Use only the notes below to answer. If they
   * do not cover it, say you do not know." — which a small model reads as a
   * policy it is being tested on rather than as material: asked what James did
   * at GoTu, with the answer sitting directly above the question, it replied
   * "I'm sorry, but I can't assist with that request."
   *
   * Stating what the notes *are* and then asking works, because it leaves the
   * model with only one thing to do. The staying-inside-the-notes half is
   * carried by the notes being the only relevant thing in the window, which at
   * this size is enough.
   */
  return [
    "Notes about James:",
    ...found.map((passage) => `- ${passage.text}`),
    "",
    `Using the notes above, answer briefly: ${question}`
  ].join("\n");
}

export { FLOOR as KNOWLEDGE_FLOOR };
