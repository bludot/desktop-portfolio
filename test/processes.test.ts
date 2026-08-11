import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import * as processes from '../src/processes'
import ProcessesContent, { uptime } from '../src/contents/processes'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

beforeEach(() => {
  processes.reset()
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  processes.reset()
  host.remove()
})

/** A service that records what was done to it, and needs no thread. */
const service = (name = 'thing', over: Partial<processes.Service<{ id: number }>> = {}) => {
  const stopped: Array<{ id: number }> = []
  let built = 0
  return {
    stopped,
    started: () => built,
    spec: {
      name,
      label: 'Thing',
      start: () => ({ id: ++built }),
      stop: (resource: { id: number }) => {
        stopped.push(resource)
      },
      ...over,
    } as processes.Service<{ id: number }>,
  }
}

describe('the process register', () => {
  /*
   * The whole reason it exists: the second ask gets the first answer. A window
   * that closes and opens again finds what it left running rather than paying
   * for it twice.
   */
  it('starts a service once, however many times it is asked for', () => {
    const { spec, started } = service()

    const first = processes.ensure(spec)
    const second = processes.ensure(spec)

    expect(second).toBe(first)
    expect(started()).toBe(1)
  })

  it('says what is running, and stays quiet about what is not', () => {
    const { spec } = service()

    expect(processes.running('thing')).toBe(false)
    expect(processes.list()).toEqual([])

    processes.ensure(spec)

    expect(processes.running('thing')).toBe(true)
    expect(processes.list().map((p) => p.label)).toEqual(['Thing'])
  })

  it('releases what a process held when it is killed', () => {
    const { spec, stopped } = service()
    const resource = processes.ensure(spec)

    processes.kill('thing')

    expect(stopped).toEqual([resource])
    expect(processes.running('thing')).toBe(false)
  })

  // Killing is not deleting the recipe: the next ask starts a fresh one.
  it('starts again after a kill', () => {
    const { spec, started } = service()

    processes.ensure(spec)
    processes.kill('thing')
    processes.ensure(spec)

    expect(started()).toBe(2)
  })

  it('does nothing when asked to kill something that is not running', () => {
    const { spec, stopped } = service()
    processes.ensure(spec)

    processes.kill('something else')

    expect(stopped).toEqual([])
    expect(processes.running('thing')).toBe(true)
  })

  /*
   * Out of the register before `stop` runs, so a teardown that reaches back in
   * — dropping a cache another process would rebuild from — finds it already
   * gone rather than halfway out.
   */
  it('has already forgotten a process by the time its stop runs', () => {
    let seen: boolean | undefined
    const { spec } = service('thing', {
      stop: () => {
        seen = processes.running('thing')
      },
    })

    processes.ensure(spec)
    processes.kill('thing')

    expect(seen).toBe(false)
  })

  it('keeps a stop that throws from wedging the register', () => {
    const { spec } = service('thing', {
      stop: () => {
        throw new Error('teardown went wrong')
      },
    })
    processes.ensure(spec)

    expect(() => processes.kill('thing')).toThrow('teardown went wrong')
    // The point: it is still gone, and something else can start.
    expect(processes.running('thing')).toBe(false)
  })

  it('tells watchers when the table changes, until they stop watching', () => {
    const told = vi.fn()
    const { spec } = service()

    const stop = processes.watch(told)
    processes.ensure(spec)
    expect(told).toHaveBeenCalledTimes(1)

    processes.kill('thing')
    expect(told).toHaveBeenCalledTimes(2)

    stop()
    processes.ensure(spec)
    expect(told).toHaveBeenCalledTimes(2)
  })

  // Reading the line at the moment the table is drawn, rather than at the
  // moment the process started: what is interesting is what it is doing now.
  it('reads the detail line fresh every time', () => {
    let holding = 'nothing'
    const { spec } = service('thing', { detail: () => holding })
    processes.ensure(spec)

    expect(processes.list()[0].detail()).toBe('nothing')
    holding = 'a model'
    expect(processes.list()[0].detail()).toBe('a model')
  })

  it('lists in the order things were started', () => {
    processes.ensure(service('first').spec)
    processes.ensure(service('second').spec)
    processes.ensure(service('third').spec)

    expect(processes.list().map((p) => p.name)).toEqual(['first', 'second', 'third'])
  })
})

describe('uptime', () => {
  const at = (seconds: number) => {
    const since = new Date('2026-08-11T12:00:00Z')
    return uptime(since, new Date(since.getTime() + seconds * 1000))
  }

  it('counts in the roughest unit that is still true', () => {
    expect(at(0)).toBe('0s')
    expect(at(45)).toBe('45s')
    expect(at(60)).toBe('1m')
    expect(at(90)).toBe('1m')
    expect(at(3600)).toBe('1h 0m')
    expect(at(3600 * 2 + 60 * 5)).toBe('2h 5m')
  })

  // A clock that has gone backwards should read as "just started", not as a
  // negative age.
  it('never counts backwards', () => {
    expect(at(-30)).toBe('0s')
  })
})

describe('the processes window', () => {
  it('says what is running and how long it has been up', async () => {
    const { spec } = service('model', { label: 'Model', detail: () => 'a model · webgpu' })
    processes.ensure(spec)

    const content = new ProcessesContent()
    await content.load(host)

    const row = host.querySelector('.proc-row')!
    expect(row.querySelector('.proc-name')?.textContent).toBe('Model')
    expect(row.querySelector('.proc-detail')?.textContent).toBe('a model · webgpu')
    expect(row.querySelector('.proc-up')?.textContent).toBe('0s')

    await content.unload()
  })

  /*
   * Nothing running is the ordinary state, so it is stated as a fact about how
   * this desktop works rather than as an empty list.
   */
  it('explains itself when nothing is running', async () => {
    const content = new ProcessesContent()
    await content.load(host)

    expect(host.querySelector('.proc-row')).toBeNull()
    expect(host.querySelector('.proc-empty')?.textContent).toContain('Nothing is running')

    await content.unload()
  })

  it('stops a process from the table, and redraws without it', async () => {
    const { spec, stopped } = service('model', { label: 'Model' })
    processes.ensure(spec)

    const content = new ProcessesContent()
    await content.load(host)
    host.querySelector<HTMLButtonElement>('.proc-kill')!.click()

    expect(stopped).toHaveLength(1)
    expect(host.querySelector('.proc-row')).toBeNull()

    await content.unload()
  })

  // Something started elsewhere on the desktop appears without the window
  // being touched — that is what the register's watchers are for.
  it('picks up a process started while it is open', async () => {
    const content = new ProcessesContent()
    await content.load(host)
    expect(host.querySelector('.proc-row')).toBeNull()

    processes.ensure(service('model', { label: 'Model' }).spec)

    expect(host.querySelector('.proc-name')?.textContent).toBe('Model')
    await content.unload()
  })

  /*
   * A watcher holding a closed window's element is how a list nobody can see
   * goes on redrawing itself — and, with a timer behind it, how a closed window
   * keeps a page busy for as long as the tab is open.
   */
  it('lets go of the register when it closes', async () => {
    const content = new ProcessesContent()
    await content.load(host)
    await content.unload()

    const drawn = host.innerHTML
    processes.ensure(service('model', { label: 'Model' }).spec)

    expect(host.innerHTML).toBe(drawn)
  })
})
