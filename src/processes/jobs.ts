/**
 * Calling app logic that is running somewhere else.
 *
 * The half of the worker that stays on this thread: it allocates ids, keeps
 * track of what is outstanding, and turns replies back into resolved promises.
 * Everything above it calls `job("highlight").call("tokens", [...])` and never
 * learns there is a thread involved — which is the point, because whether there
 * is one should be a decision this file can change alone.
 *
 * The thread's lifetime belongs to the process register, so it survives every
 * window that uses it and appears in the table where somebody can end it.
 */
import * as processes from "./index";
import type { Request, Response, Unaddressed } from "./protocol";

export const JOBS_PROCESS = "jobs";

/** How a call reports and how it is taken back. */
export interface CallOptions {
  /** Called for each piece a job reports before it is finished. */
  onChunk?: (value: unknown) => void;
  signal?: AbortSignal;
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  onChunk?: (value: unknown) => void;
}

/**
 * One conversation with the thread, however many callers share it.
 *
 * A worker has a single `onmessage` slot, so a second caller assigning its own
 * handler silently takes the first's replies — the first then waits forever for
 * messages that are being delivered somewhere else. One channel, one listener,
 * one id counter is what makes "one thread serves everything" true rather than
 * merely intended.
 */
class Channel {
  private next = 1;
  private readonly pending = new Map<number, Pending>();

  constructor(private readonly worker: Worker) {
    worker.onmessage = (event: MessageEvent<Response>) => {
      const message = event.data;
      const waiting = this.pending.get(message.id);
      if (!waiting) return;

      switch (message.kind) {
        // Not terminal: a job may report a hundred times against one id.
        case "chunk":
          waiting.onChunk?.(message.value);
          break;
        case "done":
          this.pending.delete(message.id);
          waiting.resolve(message.value);
          break;
        case "aborted":
          this.pending.delete(message.id);
          waiting.reject(new DOMException("Aborted", "AbortError"));
          break;
        case "error": {
          this.pending.delete(message.id);
          const error = new Error(message.message);
          if (message.name) error.name = message.name;
          waiting.reject(error);
          break;
        }
      }
    };

    /*
     * A thread that dies takes every outstanding call with it.
     *
     * Without this they never settle, and the caller waits on something that is
     * gone — which looks exactly like something very slow. That is the failure
     * this desktop has already shipped once, in another form.
     */
    worker.onerror = (event) =>
      this.fail(
        new Error((event as ErrorEvent).message || "The jobs thread stopped")
      );
  }

  /**
   * Give up on everything outstanding.
   *
   * Called when the thread is killed as well as when it dies. `terminate()`
   * fires no event of its own, so a process killed from the table would
   * otherwise leave its callers hanging — the same hazard, arrived at
   * deliberately instead of by accident.
   */
  fail(reason: Error): void {
    this.pending.forEach((waiting) => waiting.reject(reason));
    this.pending.clear();
  }

  send(request: Unaddressed<Request>, options: CallOptions = {}): Promise<unknown> {
    const id = this.next++;
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onChunk: options.onChunk });

      if (options.signal) {
        if (options.signal.aborted) {
          this.pending.delete(id);
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        options.signal.addEventListener(
          "abort",
          () => {
            // Named, so cancelling one call cannot silence another's.
            this.worker.postMessage({
              id: this.next++,
              kind: "cancel",
              target: id
            } as Request);
          },
          { once: true }
        );
      }

      this.worker.postMessage({ ...request, id } as Request);
    });
  }
}

let channel: Channel | undefined;
/** Which jobs have been asked for, for the process table to say. */
const asked = new Set<string>();

function thread(): Channel {
  const worker = processes.ensure<Worker>({
    name: JOBS_PROCESS,
    label: "App logic",
    detail: () =>
      asked.size ? [...asked].sort().join(", ") : "idle",
    /*
     * Written out here, literally, because that is the only form a bundler can
     * see. Vite matches this exact shape to emit the worker; a path built from
     * a variable resolves in dev and produces nothing in a build — see
     * `vite.config.ts` for what that failure looks like from the outside.
     */
    start: () =>
      new Worker(new URL("./jobs.worker.ts", import.meta.url), {
        type: "module"
      }),
    stop: (worker) => {
      // Tell the callers before taking the thread away, not after.
      channel?.fail(new Error("The jobs process was killed"));
      channel = undefined;
      asked.clear();
      worker.terminate();
    }
  });

  if (!channel) channel = new Channel(worker);
  return channel;
}

export interface Job {
  call<T>(method: string, args?: unknown[], options?: CallOptions): Promise<T>;
}

/**
 * A job, by name.
 *
 * Nothing starts here — the thread is made by the first actual call, so naming
 * a job costs nothing and a visitor who never reaches the surface that uses it
 * never pays for one.
 */
export function job(name: string): Job {
  return {
    call<T>(method: string, args: unknown[] = [], options?: CallOptions) {
      const channel = thread();
      asked.add(name);
      return channel.send(
        { kind: "call", job: name, method, args },
        options
      ) as Promise<T>;
    }
  };
}

/** Whether the thread is up. Starts nothing; for tests and the table. */
export function threadRunning(): boolean {
  return processes.running(JOBS_PROCESS);
}
