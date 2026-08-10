import { embedder, similarity, EMBEDDING_MODEL, type Embedder, type Progress } from "./engine";
import { readCache, writeCache } from "../Store";
import type { Repo } from "../utils/github";

/**
 * Searching eighty-eight repositories by what they are, not by what they spell.
 *
 * The launcher already matches names and descriptions literally, and that is
 * the right first answer: somebody typing "weeb" wants weeb-vip, and no amount
 * of cleverness improves on that. What it cannot do is answer "message queue"
 * with a repository whose description says "events with Kafka, Pulsar,
 * RabbitMQ", because the two share no letters — and on a list this size, the
 * thing you half-remember is exactly the thing you cannot spell.
 *
 * So this sits beside the literal ranking rather than replacing it: each
 * repository becomes a vector once, the query becomes one per keystroke, and
 * anything close enough is offered *after* whatever matched literally.
 *
 * The vectors are cached. Eighty-eight of them is a second of arithmetic the
 * first time and nothing at all on every visit after, and the cache is keyed by
 * the model and by the repositories themselves, so a new model or a changed
 * description rebuilds rather than answering from a stale one.
 */

/** Where the vectors live between visits. */
const CACHE_KEY = "repo-embeddings";

/**
 * How alike is alike enough.
 *
 * Below this, MiniLM will still rank *something* first — cosine similarity
 * always has a best answer, however wrong. The floor is what stops "asdf"
 * returning three repositories with great confidence.
 */
const FLOOR = 0.28;

/** What a repository is turned into before it is embedded. */
export function sentence(repo: Repo): string {
  return [repo.name.replace(/[-_]/g, " "), repo.language, repo.description]
    .filter(Boolean)
    .join(". ");
}

/** Names a repository across renders and across visits. */
export const keyOf = (repo: Repo): string => `${repo.owner}/${repo.name}`;

interface StoredVectors {
  model: string;
  /** What was indexed, so a changed corpus is not answered from an old index. */
  fingerprint: string;
  vectors: Record<string, number[]>;
}

/**
 * A cheap description of the corpus.
 *
 * Names and descriptions, in order — enough that renaming a repository or
 * rewriting its description invalidates the index, without hashing every byte
 * of everything on every open.
 */
export function fingerprint(repos: Repo[]): string {
  return repos.map((repo) => `${keyOf(repo)}:${repo.description ?? ""}`).join("|");
}

export interface Match {
  key: string;
  score: number;
}

/**
 * The repositories, as vectors, with the query answered against them.
 *
 * Built once per corpus and kept for the life of the page. Nothing here throws
 * outward: this is an improvement on a search box that already works, so a
 * model that will not load leaves the launcher exactly as it was.
 */
export class RepoIndex {
  private vectors = new Map<string, Float32Array>();
  private building?: Promise<void>;
  private corpus = "";
  /** Query vectors, because people type the same three letters all day. */
  private readonly queries = new Map<string, Float32Array>();

  constructor(private readonly model: Embedder = embedder()) {}

  get ready(): boolean {
    return this.vectors.size > 0;
  }

  /**
   * Make sure the index covers these repositories.
   *
   * Safe to call on every open: it returns immediately once the corpus it was
   * built from still matches, and the work is shared when two callers arrive
   * together.
   */
  build(repos: Repo[], onProgress?: Progress): Promise<void> {
    const corpus = fingerprint(repos);
    if (this.corpus === corpus && this.vectors.size) return Promise.resolve();
    if (this.building && this.corpus === corpus) return this.building;

    this.corpus = corpus;
    this.building = this.fill(repos, corpus, onProgress).catch(() => {
      // Leave the index empty rather than half-built: `search` then answers
      // nothing, and the launcher falls back to matching letters.
      this.vectors.clear();
      this.building = undefined;
    });
    return this.building;
  }

  private async fill(repos: Repo[], corpus: string, onProgress?: Progress) {
    const stored = await readCache<StoredVectors>(CACHE_KEY);
    if (
      stored?.value &&
      stored.value.model === this.model.constructor.name + EMBEDDING_MODEL &&
      stored.value.fingerprint === corpus
    ) {
      Object.entries(stored.value.vectors).forEach(([key, vector]) =>
        this.vectors.set(key, Float32Array.from(vector))
      );
      onProgress?.(1);
      return;
    }

    await this.model.load(onProgress);

    const keys = repos.map(keyOf);
    const vectors = await this.model.embed(repos.map(sentence));
    keys.forEach((key, i) => this.vectors.set(key, vectors[i]));

    await writeCache(CACHE_KEY, {
      model: this.model.constructor.name + EMBEDDING_MODEL,
      fingerprint: corpus,
      vectors: Object.fromEntries(
        keys.map((key, i) => [key, Array.from(vectors[i])])
      )
    } satisfies StoredVectors);
  }

  /**
   * What this query is about, as repository keys, best first.
   *
   * Returns nothing at all until the index is built, and nothing for a query
   * too short to mean anything — two letters are a prefix, not a topic, and the
   * literal match is a better answer to them anyway.
   */
  async search(query: string, limit = 4): Promise<Match[]> {
    const q = query.trim();
    if (!this.ready || q.length < 3) return [];

    let vector = this.queries.get(q);
    if (!vector) {
      try {
        [vector] = await this.model.embed([q]);
      } catch {
        return [];
      }
      this.queries.set(q, vector);
    }

    const matches: Match[] = [];
    this.vectors.forEach((candidate, key) => {
      const score = similarity(vector!, candidate);
      if (score >= FLOOR) matches.push({ key, score });
    });

    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

export { FLOOR as SIMILARITY_FLOOR };
