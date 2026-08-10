import {
  resolveDevice,
  type Device,
  type DevicePreference,
  type Progress
} from "./engine";

/**
 * A model small enough to arrive over the wire, answering in the window.
 *
 * Nothing leaves the machine: there is no key to leak, no endpoint to pay for,
 * and the conversation is not somebody else's training data. The price is that
 * the weights arrive over the wire once, and that a model this size invents
 * facts with total confidence — it is good at rephrasing what it has been
 * handed and bad at recalling anything it has not. The window says so out loud
 * rather than letting somebody discover it by asking about James's career and
 * being told something plausible and wrong.
 *
 * Same two backends as the embedder next door: WebGPU where it exists, WASM
 * where it does not, one set of ONNX weights either way, and threads left off
 * so the app windows keep working. See `engine.ts` for why.
 */

export interface ChatModel {
  id: string;
  /** What it is called in the window. */
  label: string;
  /** Roughly what it costs to fetch, in the words somebody would use. */
  size: string;
  /** What it is actually like to talk to. No marketing. */
  note: string;
}

/**
 * What is on offer, smallest first.
 *
 * Three rungs rather than a catalogue: the smallest because it is what a slow
 * connection can bear, the largest because somebody on a desktop with a GPU
 * should be able to see what the difference buys, and the middle one as the
 * default because it is the first that answers the question it was asked.
 *
 * That middle rung is not a guess. At 135M, asked what it was up to, this
 * window wrote a laboratory scene with invented colleagues and ran to the token
 * limit without answering — no amount of sampling discipline fixes a model that
 * size. Half a billion parameters is where it stops.
 *
 * Anything past a billion is deliberately absent. A 2B model is another
 * gigabyte and a half, does not fit in the WASM address space at all, and would
 * mean offering a window that cannot work to every visitor without WebGPU.
 */
export const CHAT_MODELS: ChatModel[] = [
  {
    id: "HuggingFaceTB/SmolLM2-135M-Instruct",
    label: "SmolLM2 135M",
    size: "~100MB",
    note: "Fastest to arrive. Writes fluently and wanders off the question."
  },
  {
    id: "onnx-community/Qwen2.5-0.5B-Instruct",
    label: "Qwen2.5 0.5B",
    size: "~350MB",
    note: "The default. Answers what was asked, briefly."
  },
  {
    id: "onnx-community/Llama-3.2-1B-Instruct-ONNX",
    label: "Llama 3.2 1B",
    size: "~900MB",
    note: "Conversational. Worth it on a GPU, painful without one."
  }
];

/** What a window gets when nobody has chosen. */
export const CHAT_MODEL = CHAT_MODELS[1].id;

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatEngine {
  readonly device: Device | undefined;
  /** Which of `CHAT_MODELS` this one is. */
  readonly model: string;
  /** True when the GPU was asked for and this browser could not give it. */
  readonly fellBackToCpu: boolean;
  load(onProgress?: Progress): Promise<void>;
  /**
   * Answer, a token at a time.
   *
   * Streamed rather than returned whole because on a CPU this writes at about
   * reading speed: waiting for the last word before showing the first turns a
   * working answer into a frozen window.
   */
  reply(
    messages: Message[],
    onToken: (text: string) => void,
    signal?: AbortSignal
  ): Promise<string>;
  dispose(): void;
}

/**
 * How much it may say before it is cut off.
 *
 * A small model left to its own devices will happily continue for pages,
 * repeating itself with growing confidence — and a cap that is too generous is
 * an invitation to drift rather than a safety net. This is a short paragraph,
 * which is all anybody wants from a window like this.
 */
const MAX_TOKENS = 160;

class TransformersChat implements ChatEngine {
  device: Device | undefined;
  fellBackToCpu = false;
  private generate?: (
    input: unknown,
    options: Record<string, unknown>
  ) => Promise<Array<{ generated_text: unknown }>>;
  private tokenizer?: unknown;
  private loading?: Promise<void>;

  constructor(
    readonly model: string = CHAT_MODEL,
    private readonly preference: DevicePreference = "auto"
  ) {}

  load(onProgress?: Progress): Promise<void> {
    if (!this.loading) this.loading = this.bring(onProgress);
    return this.loading;
  }

  private async bring(onProgress?: Progress): Promise<void> {
    const files = new Map<string, { at: number; of: number }>();
    const { pipeline, env } = await import("@huggingface/transformers");

    env.allowLocalModels = false;
    if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;

    const { device, fellBack } = resolveDevice(this.preference);
    this.fellBackToCpu = fellBack;
    const pipe = await pipeline("text-generation", this.model, {
      device,
      /*
       * Four bits here where the embedder takes eight. The trade runs the other
       * way for generation: the file is the thing a visitor waits for, and a
       * chat that is a little more repetitive is a smaller cost than one that
       * takes twice as long to arrive.
       */
      dtype: "q4",
      progress_callback: (event: {
        status: string;
        file?: string;
        loaded?: number;
        total?: number;
      }) => {
        if (!onProgress) return;
        if (event.status === "progress" && event.file && event.total) {
          files.set(event.file, { at: event.loaded ?? 0, of: event.total });
          let at = 0;
          let of = 0;
          files.forEach((f) => {
            at += f.at;
            of += f.of;
          });
          if (of) onProgress(Math.min(1, at / of));
        }
        if (event.status === "ready") onProgress(1);
      }
    });

    this.device = device;
    this.tokenizer = (pipe as unknown as { tokenizer: unknown }).tokenizer;
    this.generate = pipe as unknown as typeof this.generate;
  }

  async reply(
    messages: Message[],
    onToken: (text: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    if (!this.generate) throw new Error("Chat used before it was loaded");

    const { TextStreamer } = await import("@huggingface/transformers");
    let answer = "";

    const streamer = new TextStreamer(this.tokenizer as never, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        if (signal?.aborted) return;
        answer += text;
        onToken(text);
      }
    });

    /*
     * Cool, and narrow.
     *
     * The first version ran at 0.7 with nothing but nucleus sampling, and a
     * small model given that much room does not get more creative — it gets
     * further from the question. It answered "hey what\'s up" with a laboratory
     * scene, quotation marks and a character called Sarah, because at every
     * token there was a long tail of plausible-enough words and it kept picking
     * from it.
     *
     * So: a temperature low enough that the likely word usually wins, `top_k`
     * to cut the tail off outright rather than trusting the mass to be small,
     * and a mild repetition penalty — mild, because a heavy one at this size
     * pushes it off the topic to avoid saying a word twice.
     */
    const output = await this.generate(messages, {
      max_new_tokens: MAX_TOKENS,
      temperature: 0.3,
      top_k: 40,
      top_p: 0.9,
      do_sample: true,
      repetition_penalty: 1.1,
      // It is a chat: it should stop when its turn ends, not when it runs out
      // of budget. Without this the streamer prints straight through the end
      // of the turn and into an imagined reply.
      return_full_text: false,
      streamer
    });

    if (answer) return answer.trim();

    /*
     * Nothing streamed — an implementation without a streamer, or one that
     * finished in a single chunk. The reply is in the output either way, and
     * the last message of the last turn is the model's own.
     */
    const generated = output?.[0]?.generated_text;
    if (Array.isArray(generated)) {
      const last = generated[generated.length - 1] as { content?: string };
      return (last?.content ?? "").trim();
    }
    return typeof generated === "string" ? generated.trim() : "";
  }

  /** Whether this engine was built for the device somebody is now asking for. */
  matches(preference: DevicePreference): boolean {
    return this.preference === preference;
  }

  dispose(): void {
    this.generate = undefined;
    this.tokenizer = undefined;
    this.loading = undefined;
    this.device = undefined;
    this.fellBackToCpu = false;
  }
}

let shared: ChatEngine | undefined;

/**
 * The chat model on the page, for whatever has been chosen.
 *
 * One at a time: two of these is a gigabyte of the same idea held in memory, so
 * changing either the model or the device lets go of the last one before the
 * next is brought in. The weights themselves stay in the browser's cache, so
 * going back to a model already used is a load rather than a download.
 */
export function chatEngine(
  model: string = CHAT_MODEL,
  preference: DevicePreference = "auto"
): ChatEngine {
  const current = shared as TransformersChat | undefined;
  if (current?.model === model && current.matches(preference)) return current;

  shared?.dispose();
  shared = new TransformersChat(model, preference);
  return shared;
}

/** Swap the implementation — for tests, and for whatever replaces this one. */
export function setChatEngine(replacement: ChatEngine | undefined): void {
  shared = replacement;
}
