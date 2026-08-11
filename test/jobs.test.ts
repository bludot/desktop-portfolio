import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as processes from '../src/processes'
import { JOBS_PROCESS, job, threadRunning } from '../src/processes/jobs'
import type { Request, Response } from '../src/processes/protocol'

/**
 * The jobs thread, faked well enough to answer.
 *
 * jsdom has no `Worker`, and what these cases are about is the conversation
 * rather than the work: ids, what settles a call and what does not, and what
 * happens to callers when the thread goes away. Replies arrive on a microtask,
 * as a real one's would, so nothing can come to depend on an answer landing
 * inside the call that sent it.
 */
class FakeWorker {
  static built: FakeWorker[] = []
  /** Set false before the first call to catch one mid-flight. */
  static autoAnswer = true
  onmessage: ((event: { data: Response }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  terminated = false
  readonly sent: Request[] = []
  /** Calls the test has chosen not to answer yet, by id. */
  private held = new Set<number>()

  constructor() {
    FakeWorker.built.push(this)
  }

  postMessage(request: Request) {
    this.sent.push(request)
    if (request.kind === 'cancel') {
      queueMicrotask(() => this.onmessage?.({ data: { id: request.target, kind: 'aborted' } }))
      return
    }
    if (!FakeWorker.autoAnswer || this.held.has(-1)) return // caught mid-flight
    queueMicrotask(() =>
      this.onmessage?.({ data: { id: request.id, kind: 'done', value: `${request.job}.${request.method}` } }),
    )
  }

  /** Answer nothing from here on, so a call can be caught mid-flight. */
  holdEverything() {
    this.held.add(-1)
  }

  say(message: Response) {
    this.onmessage?.({ data: message })
  }

  terminate() {
    this.terminated = true
  }
}

beforeEach(() => {
  FakeWorker.built = []
  FakeWorker.autoAnswer = true
  vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker)
})

afterEach(() => {
  processes.reset()
  vi.unstubAllGlobals()
})

describe('the jobs thread', () => {
  // Naming a job is free; a visitor who never reaches the surface that uses one
  // never pays for a thread.
  it('is not started by naming a job, only by calling one', async () => {
    const highlight = job('highlight')
    expect(threadRunning()).toBe(false)

    await highlight.call('tokens', ['ts', 'const a = 1'])

    expect(threadRunning()).toBe(true)
    expect(FakeWorker.built).toHaveLength(1)
  })

  it('hosts every job on one thread', async () => {
    await job('highlight').call('tokens', [])
    await job('something-else').call('run', [])

    expect(FakeWorker.built).toHaveLength(1)
  })

  it('returns what the job returned', async () => {
    await expect(job('highlight').call('tokens', ['ts', 'x'])).resolves.toBe('highlight.tokens')
  })

  it('carries the arguments across', async () => {
    await job('highlight').call('tokens', ['ts', 'const a = 1'])

    const sent = FakeWorker.built[0].sent[0]
    expect(sent).toMatchObject({ kind: 'call', job: 'highlight', method: 'tokens' })
    expect((sent as Extract<Request, { kind: 'call' }>).args).toEqual(['ts', 'const a = 1'])
  })

  /*
   * Two calls in flight at once must not be able to take each other's replies.
   * A worker has one `onmessage`, so everything shares a listener and the id is
   * the only thing keeping the conversations apart.
   */
  it('keeps concurrent calls apart', async () => {
    const worker = () => FakeWorker.built[0]
    const first = job('a').call('one', [])
    const second = job('b').call('two', [])

    await expect(first).resolves.toBe('a.one')
    await expect(second).resolves.toBe('b.two')
    expect(worker().sent.map((r) => r.id)).toEqual([1, 2])
  })

  it('reports a failure as an error, with its name', async () => {
    const call = job('highlight').call('tokens', [])
    // The fake answers `done` on a microtask; get in first with a failure.
    FakeWorker.built[0].say({ id: 1, kind: 'error', message: 'the grammar threw', name: 'SyntaxError' })

    await expect(call).rejects.toThrow('the grammar threw')
  })

  describe('reporting as it goes', () => {
    it('passes chunks on without settling the call', async () => {
      const chunks: unknown[] = []
      const call = job('slow').call('run', [], { onChunk: (v) => chunks.push(v) })

      const worker = FakeWorker.built[0]
      worker.say({ id: 1, kind: 'chunk', value: 'a' })
      worker.say({ id: 1, kind: 'chunk', value: 'b' })
      expect(chunks).toEqual(['a', 'b'])

      worker.say({ id: 1, kind: 'done', value: 'finished' })
      await expect(call).resolves.toBe('finished')
    })
  })

  describe('taking a call back', () => {
    it('names the call it is cancelling rather than cancelling everything', async () => {
      FakeWorker.autoAnswer = false
      const stop = new AbortController()
      const call = job('slow').call('run', [], { signal: stop.signal })

      stop.abort()
      await expect(call).rejects.toThrow(/abort/i)

      const cancel = FakeWorker.built[0].sent.find((r) => r.kind === 'cancel')
      expect(cancel).toMatchObject({ kind: 'cancel', target: 1 })
    })

    it('refuses a call whose signal was already aborted', async () => {
      const stop = new AbortController()
      stop.abort()

      await expect(job('slow').call('run', [], { signal: stop.signal })).rejects.toThrow(/abort/i)
    })
  })

  /*
   * The failure this desktop has already shipped once, in another form: a
   * thread that goes away without telling anybody leaves every caller waiting
   * on something that no longer exists, which is indistinguishable from
   * something very slow.
   */
  describe('when the thread goes away', () => {
    it('fails outstanding calls when it dies', async () => {
      const worker = () => FakeWorker.built[0]
      const call = job('slow').call('run', [])
      worker().holdEverything()

      worker().onerror?.({ message: 'it stopped' })

      await expect(call).rejects.toThrow('it stopped')
    })

    it('fails outstanding calls when it is killed from the table', async () => {
      await job('highlight').call('tokens', [])
      FakeWorker.built[0].holdEverything()
      const inFlight = job('highlight').call('tokens', [])

      processes.kill(JOBS_PROCESS)

      await expect(inFlight).rejects.toThrow(/killed/)
      expect(FakeWorker.built[0].terminated).toBe(true)
    })

    it('starts a fresh one for the next call', async () => {
      await job('highlight').call('tokens', [])
      processes.kill(JOBS_PROCESS)

      await expect(job('highlight').call('tokens', [])).resolves.toBe('highlight.tokens')
      expect(FakeWorker.built).toHaveLength(2)
    })
  })

  describe('in the table', () => {
    it('says it is idle before anything has been asked of it', async () => {
      await job('highlight').call('tokens', [])
      processes.kill(JOBS_PROCESS)

      expect(processes.running(JOBS_PROCESS)).toBe(false)
    })

    it('names the jobs it is holding', async () => {
      await job('highlight').call('tokens', [])
      await job('render').call('run', [])

      const entry = processes.list().find((p) => p.name === JOBS_PROCESS)!
      expect(entry.label).toBe('App logic')
      expect(entry.detail()).toBe('highlight, render')
    })
  })
})
