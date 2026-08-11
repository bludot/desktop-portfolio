/**
 * What the page and a worker say to each other.
 *
 * Small and closed on purpose. A worker boundary is the one place where a shape
 * mismatch turns into silence rather than a type error — the message goes, the
 * other side does not recognise it, and nobody hears anything again — so every
 * message is one of these and every reply carries the id it answers.
 *
 * Deliberately narrower than the model protocol next door, which grew four
 * model-shaped fields onto its `done` and reports progress in downloaded bytes.
 * Arbitrary work has no bytes to report and no tokens to stream, so what travels
 * here is an opaque `value` and the job decides what it means.
 */

/** A job asked to do something, or a call being taken back. */
export type Request =
  | { id: number; kind: "call"; job: string; method: string; args: unknown[] }
  /**
   * Cancel names its target rather than riding on its own id.
   *
   * The model worker's abort is a single module-global boolean, which silences
   * whatever happens to be streaming — including a second caller's answer. A
   * cancel that says which call it means can be honoured without collateral.
   */
  | { id: number; kind: "cancel"; target: number };

/** What comes back. `chunk` may arrive many times; the rest end the call. */
export type Response =
  /** Partial output, against a call that is still running. */
  | { id: number; kind: "chunk"; value: unknown }
  | { id: number; kind: "done"; value: unknown }
  /**
   * A failure, flattened.
   *
   * Only a string and a name survive a structured clone of most Error
   * subclasses, so the name travels separately rather than being lost — it is
   * the difference between "something went wrong" and "the grammar threw".
   */
  | { id: number; kind: "error"; message: string; name?: string }
  | { id: number; kind: "aborted" };

/**
 * `Omit` over a union, distributed.
 *
 * Applied directly, the built-in collapses these shapes into the fields they
 * have in common — `id` and `kind` — and nothing else type-checks. Written this
 * way it maps over each member, which is what lets a caller hand over a request
 * without an id and have the channel allocate one.
 */
export type Unaddressed<T> = T extends unknown ? Omit<T, "id"> : never;

/**
 * What a job module looks like from the host's side.
 *
 * Methods take whatever they take and return whatever they return; anything
 * that wants to report as it goes takes the second argument and calls it. The
 * host does not care, and neither does the protocol — `value` is opaque all the
 * way across.
 */
export type JobModule = Record<
  string,
  (...args: never[]) => unknown | Promise<unknown>
>;
