/**
 * Running a model on the machine that is reading the page.
 *
 * The desktop asks nothing of a server: there is no key to leak, no request to
 * rate-limit, and nothing to pay for per visitor. The price is that the model
 * arrives over the wire once, and that whatever runs it has to work on whatever
 * the browser turns out to support.
 *
 * Two backends, one library. `transformers.js` runs the same ONNX weights on
 * WebGPU where it exists and on WASM where it does not, so a visitor with a
 * modern Chrome and a visitor on Safari get the same answers at different
 * speeds — rather than one of them getting nothing. Pairing two *runtimes*
 * instead (WebLLM for the GPU, this for the CPU) would mean two sets of weights
 * in two formats, two cache entries, and twice the bandwidth for the same
 * feature, so it is deliberately not done.
 *
 * Threads are deliberately off. Multi-threaded WASM needs `SharedArrayBuffer`,
 * which needs `Cross-Origin-Embedder-Policy` on the document — and that policy
 * refuses to embed any frame whose origin does not opt in, which would take out
 * every app window on this desktop. A slower CPU path is worth more than a
 * desktop with no apps in it.
 *
 * Nothing here is imported until something asks for it: the library and the
 * weights are both behind a dynamic import, so a visitor who never opens the
 * launcher never pays for either.
 */

/** Where the arithmetic happens. */
export type Device = "webgpu" | "wasm";

/**
 * The one model this loads, and why it is small enough to be worth loading.
 *
 * MiniLM at eight-bit is about 23MB — a fifth of a photograph on most sites,
 * and small enough that the first search is not an event. It turns a sentence
 * into 384 numbers, which is all that is wanted here: something that knows
 * "anime tracker" and "weeb.vip" belong together without either word appearing
 * in the other.
 */
export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

/** Fraction of the download that has arrived, 0 to 1. */
export type Progress = (fraction: number) => void;

/**
 * Something that turns text into vectors.
 *
 * Deliberately the whole surface: a caller passes strings and gets numbers, and
 * everything about ONNX, quantisation and device selection stays in here. A
 * second implementation — a different library, a remote endpoint, a stub in a
 * test — only has to satisfy this.
 */
export interface Embedder {
  /** The device it settled on, once loaded. */
  readonly device: Device | undefined;
  /** Bring the model in. Safe to call twice; the second call waits on the first. */
  load(onProgress?: Progress): Promise<void>;
  /** One vector per string, normalised, so similarity is a dot product. */
  embed(texts: string[]): Promise<Float32Array[]>;
  /** Let go of the weights. */
  dispose(): void;
}

/**
 * The fastest backend this browser can offer.
 *
 * Asked at load rather than remembered: a page can be open across a driver
 * change, and the answer costs a property lookup.
 */
export function bestDevice(): Device {
  const gpu = (navigator as Navigator & { gpu?: unknown }).gpu;
  return gpu ? "webgpu" : "wasm";
}

/**
 * How far along the download is, from a stream of per-file progress events.
 *
 * The library reports each file separately, and a bar that restarts for every
 * one of them is worse than no bar. This keeps the running total across
 * whatever files turn up rather than assuming how many there will be.
 */
class Downloads {
  private readonly files = new Map<string, { at: number; of: number }>();

  record(file: string, at: number, of: number): void {
    if (!of) return;
    this.files.set(file, { at, of });
  }

  fraction(): number {
    let at = 0;
    let of = 0;
    this.files.forEach((file) => {
      at += file.at;
      of += file.of;
    });
    return of ? Math.min(1, at / of) : 0;
  }
}

class TransformersEmbedder implements Embedder {
  device: Device | undefined;
  private pipeline?: (
    texts: string[],
    options: { pooling: "mean"; normalize: boolean }
  ) => Promise<{ tolist(): number[][] }>;
  /** The load in flight, so a second caller waits rather than starting another. */
  private loading?: Promise<void>;

  constructor(private readonly model: string = EMBEDDING_MODEL) {}

  load(onProgress?: Progress): Promise<void> {
    if (!this.loading) this.loading = this.bring(onProgress);
    return this.loading;
  }

  private async bring(onProgress?: Progress): Promise<void> {
    const downloads = new Downloads();

    /*
     * Imported here, not at the top of the file.
     *
     * The library is a few hundred kilobytes of JavaScript before a single
     * weight is fetched, and most visits to a portfolio never search anything.
     * A static import would put all of it in the bundle that has to arrive
     * before the desktop can boot.
     */
    const { pipeline, env } = await import("@huggingface/transformers");

    // There is no server of ours to hold a copy, so the hub is the only source.
    env.allowLocalModels = false;
    // See the note at the top: threads would cost this desktop its app windows.
    if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;

    const device = bestDevice();
    const extractor = await pipeline("feature-extraction", this.model, {
      device,
      /*
       * Eight-bit weights. Four would be smaller again, but MiniLM is already
       * small and the accuracy of the ranking is the whole point of it being
       * here — a search that returns the wrong repository quickly is not a
       * feature.
       */
      dtype: "q8",
      progress_callback: (event: {
        status: string;
        file?: string;
        loaded?: number;
        total?: number;
      }) => {
        if (!onProgress) return;
        if (event.status === "progress" && event.file) {
          downloads.record(event.file, event.loaded ?? 0, event.total ?? 0);
          onProgress(downloads.fraction());
        }
        if (event.status === "ready") onProgress(1);
      }
    });

    this.device = device;
    this.pipeline = extractor as unknown as typeof this.pipeline;
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    if (!texts.length) return [];
    if (!this.pipeline) throw new Error("Embedder used before it was loaded");

    // Mean pooling and normalising happen inside the model's graph, so what
    // comes back is ready to compare with a dot product.
    const output = await this.pipeline(texts, { pooling: "mean", normalize: true });
    return output.tolist().map((row) => Float32Array.from(row));
  }

  dispose(): void {
    this.pipeline = undefined;
    this.loading = undefined;
    this.device = undefined;
  }
}

/** The embedder this desktop uses. One per page; the weights are not cheap. */
let shared: Embedder | undefined;

export function embedder(): Embedder {
  if (!shared) shared = new TransformersEmbedder();
  return shared;
}

/** Swap the implementation. For tests, and for whatever replaces this one. */
export function setEmbedder(replacement: Embedder | undefined): void {
  shared = replacement;
}

/**
 * How alike two vectors are, from -1 to 1.
 *
 * A plain dot product, because everything here is normalised on the way out of
 * the model — dividing by two lengths that are both 1 is work for nothing.
 */
export function similarity(a: Float32Array, b: Float32Array): number {
  const length = Math.min(a.length, b.length);
  let total = 0;
  for (let i = 0; i < length; i++) total += a[i] * b[i];
  return total;
}
