/// <reference lib="webworker" />
/**
 * The thread that app logic runs on, and the closest thing here to `fork`.
 *
 * A browser has no fork: no shared address space, no copy-on-write, and
 * `postMessage` copies by serialising. What it does have is the other half of
 * the pair — a blank process that is told what to become. This file is that
 * blank process. It knows how to talk, and nothing about the work; the first
 * call naming a job loads the module for it and everything after that is
 * dispatch.
 *
 * One thread hosts every job rather than one thread each. Threads are not free
 * — each is a fresh JS heap and a copy of whatever it imports — and this
 * desktop's jobs are brief and idle between presses, so they are far better
 * neighbours than tenants.
 *
 * The handler is assigned at the top level, synchronously, on purpose. Messages
 * posted before a worker finishes evaluating are queued and delivered once it
 * does, so a handler installed here cannot miss one. A handler installed after
 * an `await` can, and silently: the message arrives while nothing is listening
 * and the caller waits forever on a thread that is perfectly healthy.
 */
import type { JobModule, Request, Response } from "./protocol";

/**
 * The jobs there are, by name.
 *
 * Written as literal dynamic imports because that is what a bundler can see.
 * Vite reads `import("./jobs/highlight")` at build time and emits a chunk for
 * it; a path assembled from a variable is invisible, resolves in dev — where
 * modules are served as they are asked for — and fails only once deployed.
 */
const JOBS: Record<string, () => Promise<JobModule>> = {
  highlight: () => import("./jobs/highlight") as Promise<JobModule>
};

const scope = self as unknown as Worker;
const reply = (message: Response) => scope.postMessage(message);

/** Modules already loaded, so a second call does not import again. */
const loaded = new Map<string, Promise<JobModule>>();

function load(name: string): Promise<JobModule> {
  let already = loaded.get(name);
  if (!already) {
    const make = JOBS[name];
    if (!make) return Promise.reject(new Error(`No job called ${name}`));
    already = make();
    loaded.set(name, already);
  }
  return already;
}

/**
 * Calls that are still running, and whether they have been taken back.
 *
 * Per call rather than one flag for the thread. A boolean shared by everything
 * in flight means one window changing its mind silences another's answer, which
 * is the bug next door in the model worker.
 */
const abandoned = new Set<number>();

async function run(request: Extract<Request, { kind: "call" }>) {
  const module = await load(request.job);
  const method = module[request.method];
  if (typeof method !== "function") {
    throw new Error(`${request.job} has no ${request.method}`);
  }

  /*
   * Handed to the job so it can report as it goes, and closed over the id so
   * two calls reporting at once cannot be confused for each other. Silent once
   * cancelled — the work may not stop, but nothing more is said about it.
   */
  const say = (value: unknown) => {
    if (abandoned.has(request.id)) return;
    reply({ id: request.id, kind: "chunk", value });
  };

  const value = await (method as (...args: unknown[]) => unknown)(
    ...request.args,
    say
  );

  if (abandoned.has(request.id)) {
    abandoned.delete(request.id);
    reply({ id: request.id, kind: "aborted" });
    return;
  }
  reply({ id: request.id, kind: "done", value });
}

scope.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;

  if (request.kind === "cancel") {
    /*
     * Marked, not stopped. Nothing here can interrupt a function that is
     * already running — there is no preemption in a JS thread — so what cancel
     * honestly means is "stop telling me", and the caller is told `aborted`
     * rather than being left to time out.
     */
    abandoned.add(request.target);
    return;
  }

  try {
    await run(request);
  } catch (error) {
    reply({
      id: request.id,
      kind: "error",
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined
    });
  } finally {
    abandoned.delete(request.id);
  }
};
