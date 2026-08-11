import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as processes from '../src/processes'
import { MODEL_PROCESS, chat, isWarm, vectors } from '../src/ai'

/**
 * The thread, faked well enough to answer.
 *
 * jsdom has no `Worker`, and the point of these cases is what the desktop keeps
 * hold of rather than what the model says — so this speaks just enough of the
 * protocol to let a load finish: every request gets a `done` back with a device
 * on it. See `browser-ai/worker/protocol`.
 */
class FakeWorker {
  static built: FakeWorker[] = []
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  terminated = false
  readonly sent: Array<Record<string, unknown>> = []

  constructor() {
    FakeWorker.built.push(this)
  }

  postMessage(request: Record<string, unknown>) {
    this.sent.push(request)
    // Answered on a microtask, as a real one would be: nothing in the desktop
    // may depend on a reply arriving inside the call that sent it.
    queueMicrotask(() => {
      this.onmessage?.({
        data: { id: request.id, kind: 'done', device: 'wasm', fellBack: false },
      })
    })
  }

  terminate() {
    this.terminated = true
  }
}

beforeEach(() => {
  FakeWorker.built = []
  vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker)
})

afterEach(() => {
  processes.reset()
  vi.unstubAllGlobals()
})

describe('the model process', () => {
  it('is not started by loading the module, only by asking for a model', () => {
    expect(processes.running(MODEL_PROCESS)).toBe(false)

    chat('some/model', 'auto')

    expect(processes.running(MODEL_PROCESS)).toBe(true)
    expect(FakeWorker.built).toHaveLength(1)
  })

  // One thread for both. The embedder is idle whenever the chat model is busy.
  it('runs the embedder on the same thread', () => {
    chat('some/model', 'auto')
    vectors()

    expect(FakeWorker.built).toHaveLength(1)
  })

  /*
   * The reason any of this exists: asking twice for the same model gets the
   * engine that is already up. A fresh engine would send a second `load-chat`,
   * and the worker rebuilds its pipeline on every one of those — seconds of
   * arithmetic to arrive back at the state it was already in.
   */
  it('hands back the engine it already has', () => {
    const first = chat('some/model', 'auto')
    const second = chat('some/model', 'auto')

    expect(second).toBe(first)
  })

  it('builds a new one when the model or the device changes', () => {
    const first = chat('some/model', 'auto')
    const otherModel = chat('another/model', 'auto')
    const otherDevice = chat('another/model', 'wasm')

    expect(otherModel).not.toBe(first)
    expect(otherDevice).not.toBe(otherModel)
  })

  it('caches only the newest, since the worker holds only one', () => {
    const first = chat('some/model', 'auto')
    chat('another/model', 'auto')

    expect(chat('some/model', 'auto')).not.toBe(first)
  })

  it('reuses the embedder rather than rebuilding it', () => {
    expect(vectors()).toBe(vectors())
  })

  describe('warmth', () => {
    it('is nothing until a load has actually finished', async () => {
      const engine = chat('some/model', 'auto')
      expect(isWarm(engine)).toBe(false)

      await engine.load()

      expect(isWarm(engine)).toBe(true)
    })

    // An engine this module never handed out says nothing about what the worker
    // is holding, whatever it claims about itself.
    it('is never claimed for an engine from somewhere else', () => {
      const impostor = { device: 'webgpu', model: 'x', fellBackToCpu: false } as never
      expect(isWarm(impostor)).toBe(false)
    })

    it('is lost when the model is swapped out from under it', async () => {
      const first = chat('some/model', 'auto')
      await first.load()
      chat('another/model', 'auto')

      expect(isWarm(first)).toBe(false)
    })
  })

  describe('killing it', () => {
    it('stops the thread', async () => {
      const engine = chat('some/model', 'auto')
      await engine.load()

      processes.kill(MODEL_PROCESS)

      expect(FakeWorker.built[0].terminated).toBe(true)
    })

    /*
     * And drops the engines with it. A handle whose `load()` has already
     * resolved would otherwise go on reporting a model that is ready on a
     * thread that is gone — which is the one failure this desktop has already
     * shipped once, in another form: something that never answers looks exactly
     * like something that is slow.
     */
    it('drops what it was holding, so the next ask starts fresh', async () => {
      const engine = chat('some/model', 'auto')
      await engine.load()

      processes.kill(MODEL_PROCESS)
      const after = chat('some/model', 'auto')

      expect(after).not.toBe(engine)
      expect(isWarm(engine)).toBe(false)
      expect(FakeWorker.built).toHaveLength(2)
    })

    it('starts a new thread for the embedder too', () => {
      const before = vectors()
      processes.kill(MODEL_PROCESS)

      expect(vectors()).not.toBe(before)
    })
  })

  describe('in the table', () => {
    it('names the model it is holding, and where it is running it', async () => {
      const engine = chat('some/model', 'auto')

      const process = () => processes.list().find((p) => p.name === MODEL_PROCESS)!
      // Before the load settles there is no device to name, and guessing one
      // would be inventing an answer to "where is this running".
      expect(process().detail()).toBe('some/model · loading')

      await engine.load()

      expect(process().detail()).toBe('some/model · wasm')
    })
  })
})
