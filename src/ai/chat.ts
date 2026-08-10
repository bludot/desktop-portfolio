import { bestDevice, type Device, type Progress } from "./engine";

/**
 * A model small enough to arrive over the wire, answering in the window.
 *
 * 135 million parameters at four bits is about 100MB — a large image, and the
 * only thing on this desktop that costs a visitor anything to look at. In
 * exchange nothing leaves the machine: there is no key to leak, no endpoint to
 * pay for, and the conversation is not somebody else's training data.
 *
 * Be clear about what that buys. At this size the model writes fluent English
 * and invents facts with total confidence — it is good at rephrasing what it
 * has been handed and bad at recalling anything it has not. The window says so
 * out loud rather than letting somebody discover it by asking about James's
 * career and being told something plausible and wrong.
 *
 * Same two backends as the embedder next door: WebGPU where it exists, WASM
 * where it does not, one set of ONNX weights either way, and threads left off
 * so the app windows keep working. See `engine.ts` for why.
 */

/** Instruction-tuned, and the smallest one worth talking to. */
export const CHAT_MODEL = "HuggingFaceTB/SmolLM2-135M-Instruct";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatEngine {
  readonly device: Device | undefined;
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
 * repeating itself with growing confidence. This is about a paragraph.
 */
const MAX_TOKENS = 220;

class TransformersChat implements ChatEngine {
  device: Device | undefined;
  private generate?: (
    input: unknown,
    options: Record<string, unknown>
  ) => Promise<Array<{ generated_text: unknown }>>;
  private tokenizer?: unknown;
  private loading?: Promise<void>;

  constructor(private readonly model: string = CHAT_MODEL) {}

  load(onProgress?: Progress): Promise<void> {
    if (!this.loading) this.loading = this.bring(onProgress);
    return this.loading;
  }

  private async bring(onProgress?: Progress): Promise<void> {
    const files = new Map<string, { at: number; of: number }>();
    const { pipeline, env } = await import("@huggingface/transformers");

    env.allowLocalModels = false;
    if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;

    const device = bestDevice();
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

    const output = await this.generate(messages, {
      max_new_tokens: MAX_TOKENS,
      // Warm enough to be worth reading, cool enough to stay on the question.
      temperature: 0.7,
      top_p: 0.9,
      do_sample: true,
      // Small models loop; this is what stops "I can help with that." forever.
      repetition_penalty: 1.15,
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

  dispose(): void {
    this.generate = undefined;
    this.tokenizer = undefined;
    this.loading = undefined;
    this.device = undefined;
  }
}

let shared: ChatEngine | undefined;

/** The one chat model on the page. Loading two would be 200MB of the same idea. */
export function chatEngine(): ChatEngine {
  if (!shared) shared = new TransformersChat();
  return shared;
}

/** Swap the implementation — for tests, and for whatever replaces this one. */
export function setChatEngine(replacement: ChatEngine | undefined): void {
  shared = replacement;
}
