import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import * as attention from '../src/attention'
import { RULES, suggest, type Surroundings } from '../src/attention/suggestions'
import { ATTENTION_PROCESS, prompt, start } from '../src/attention/prompter'
import * as processes from '../src/processes'
import windowManager from '../src/utils/windowManager'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

const makeDesktop = () => {
  const root = document.createElement('div')
  const taskbar = document.createElement('div')
  document.body.appendChild(root)
  return {
    getElement: () => root,
    getTaskbar: () => ({ getElement: () => taskbar }),
  } as any
}

const open = (title: string) =>
  windowManager.new({
    title,
    content: document.createElement('p'),
    desktop: makeDesktop(),
    onActive: vi.fn(),
    onClose: vi.fn(),
    center: false,
    dimensions: { width: 200, height: 150 },
    windowPosition: { top: 10, left: 10 },
  } as any)

/** Close by title, since `new` hands nothing back. */
const close = (title: string) => {
  const found = windowManager.list().find((w) => w.title === title)
  if (found) windowManager.remove(found.window)
}

/** An activity record, without having to drive real windows to get one. */
const activityOf = (
  over: { seconds?: number; opened?: [string, number][]; closed?: [string, number][] } = {},
) => ({
  since: new Date(),
  opened: new Map(over.opened ?? []),
  closed: new Map(over.closed ?? []),
  open: [],
  seconds: over.seconds ?? 300,
})

const around = (over: Partial<Surroundings> = {}): Surroundings => ({
  modelWarm: () => false,
  openLauncher: vi.fn(),
  openChat: vi.fn(),
  ...over,
})

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(async () => {
  processes.reset()
  attention.forget()
  for (const w of windowManager.list()) windowManager.remove(w.window)
  host.remove()
  vi.useRealTimers()
})

describe('what the desktop notices', () => {
  it('notices nothing until it is asked to', () => {
    open('Projects')
    expect(attention.activity().opened.size).toBe(0)
  })

  it('counts a window opening, by title', () => {
    attention.watch()
    open('Projects')

    expect(attention.activity().opened.get('Projects')).toBe(1)
  })

  /*
   * Titles rather than window objects: a window closed and opened again is a
   * new object and the same intent, and intent is the whole point.
   */
  it('counts the same window opened twice as twice', () => {
    attention.watch()
    open('Projects')
    close('Projects')
    open('Projects')

    const seen = attention.activity()
    expect(seen.opened.get('Projects')).toBe(2)
    expect(seen.closed.get('Projects')).toBe(1)
  })

  it('forgets everything when asked, and keeps nothing anywhere else', () => {
    attention.watch()
    open('Projects')
    attention.forget()

    expect(attention.activity().opened.size).toBe(0)
    // Nothing to clear from storage, because nothing was ever put there.
    expect(Object.keys(localStorage)).toHaveLength(0)
  })
})

describe('what it decides to say', () => {
  // The first seconds are the worst moment: windows are still arriving and
  // anything that appears reads as a cookie banner.
  it('says nothing at all while somebody is still arriving', () => {
    const seen = activityOf({ seconds: 5, opened: [['Projects', 3]], closed: [['Projects', 2]] })
    expect(suggest(seen, around(), new Set())).toBeUndefined()
  })

  it('offers the launcher to somebody scanning the repositories twice over', () => {
    const seen = activityOf({ opened: [['Projects', 2]], closed: [['Projects', 1]] })
    const found = suggest(seen, around(), new Set())

    expect(found?.id).toBe('search-instead-of-scrolling')
  })

  it('mentions the chat only after a while, and only if it was never opened', () => {
    const never = activityOf({ seconds: 120, opened: [['About', 1], ['Experience', 1]] })
    expect(suggest(never, around(), new Set())?.id).toBe('there-is-a-model-here')

    const already = activityOf({ seconds: 120, opened: [['About', 1], ['Chat', 1]] })
    expect(suggest(already, around(), new Set())).toBeUndefined()
  })

  /*
   * The one rule that involves the model at all, and the promise the whole
   * design rests on: it is offered only when the weights are already loaded.
   * Nothing here may cause a download.
   */
  it('never offers to ask the model when no model is up', () => {
    const seen = activityOf({ opened: [['Experience', 1]] })

    expect(suggest(seen, around({ modelWarm: () => false }), new Set())).toBeUndefined()
    expect(suggest(seen, around({ modelWarm: () => true }), new Set())?.id).toBe(
      'ask-what-you-are-reading-about',
    )
  })

  it('does not repeat one that has been used up', () => {
    const seen = activityOf({ opened: [['Projects', 2]], closed: [['Projects', 1]] })
    const spent = new Set(['search-instead-of-scrolling'])

    expect(suggest(seen, around(), spent)?.id).not.toBe('search-instead-of-scrolling')
  })

  // Every rule has to be answerable, or the toast has a button that does nothing.
  it('gives every rule something to do', () => {
    RULES.forEach((rule) => {
      const built = rule.build(around())
      expect(built.text.length, rule.id).toBeGreaterThan(10)
      expect(typeof built.action.run, rule.id).toBe('function')
    })
  })
})

describe('how often it is willing to speak', () => {
  const showing = () => host.querySelectorAll('.toast').length

  /*
   * Time has to be driven, because every rule here is partly about time — the
   * whole point of the settle-in delay is that nothing happens in the first
   * seconds, which is exactly how long a test takes.
   */
  const started = () => {
    vi.useFakeTimers()
    attention.watch()
    return prompt({ host, ...around() })
  }

  /** Long enough to be past the settle-in, then let the toast mount. */
  const waitedAWhile = async (ms = 40_000) => {
    await vi.advanceTimersByTimeAsync(ms)
  }
  const settle = () => vi.advanceTimersByTimeAsync(20)

  const scannedProjectsTwice = () => {
    open('Projects')
    close('Projects')
    open('Projects')
  }

  it('says one thing at a time', async () => {
    const p = started()
    await waitedAWhile()

    scannedProjectsTwice()
    await settle()
    expect(showing()).toBe(1)

    // More activity while one is up must not stack a second on top of it.
    open('Experience')
    await settle()
    expect(showing()).toBe(1)
    p.stop()
  })

  /*
   * A dismissal is an answer. Offering the same thing again to somebody who
   * just declined it is the difference between a suggestion and nagging.
   *
   * The wait afterwards is longer than the quiet period on purpose, so that
   * what keeps it silent is the suggestion having been spent rather than the
   * clock — otherwise this passes for the wrong reason.
   */
  it('never offers the same thing twice', async () => {
    const p = started()
    await waitedAWhile()
    scannedProjectsTwice()
    await settle()

    host.querySelector<HTMLButtonElement>('.toast-close')!.click()
    await settle()
    expect(showing()).toBe(0)

    await vi.advanceTimersByTimeAsync(200_000)
    scannedProjectsTwice()
    await settle()

    expect(showing()).toBe(0)
    p.stop()
  })

  it('takes the toast away when it is stopped', async () => {
    const p = started()
    await waitedAWhile()
    scannedProjectsTwice()
    await settle()
    expect(showing()).toBe(1)

    p.stop()
    await settle()
    expect(showing()).toBe(0)
  })

  it('runs the action, and goes, when the button is pressed', async () => {
    vi.useFakeTimers()
    attention.watch()
    const openLauncher = vi.fn()
    const p = prompt({ host, ...around({ openLauncher }) })

    await waitedAWhile()
    scannedProjectsTwice()
    await settle()

    host.querySelector<HTMLButtonElement>('.toast-do')!.click()
    expect(openLauncher).toHaveBeenCalled()

    await settle()
    expect(showing()).toBe(0)
    p.stop()
  })

  // It leaves on its own, which is what makes it a toast rather than a banner.
  it('goes away by itself if nobody touches it', async () => {
    const p = started()
    await waitedAWhile()
    scannedProjectsTwice()
    await settle()
    expect(showing()).toBe(1)

    await vi.advanceTimersByTimeAsync(12_000)
    expect(showing()).toBe(0)
    p.stop()
  })
})

/*
 * Something that watches what you are doing should be visible to you and
 * stoppable by you. That is the whole argument for it being a process rather
 * than a quiet subscription, so these are the cases that make it true.
 */
describe('in the process table', () => {
  it('appears, and says what it has noticed', () => {
    start({ host, ...around() })
    open('Projects')

    const entry = processes.list().find((p) => p.name === ATTENTION_PROCESS)!
    expect(entry.label).toBe('Attention')
    expect(entry.detail()).toContain('1 window opened')
    expect(entry.detail()).toContain('0 offered')
  })

  it('is one thing however many times it is started', () => {
    start({ host, ...around() })
    start({ host, ...around() })

    expect(processes.list().filter((p) => p.name === ATTENTION_PROCESS)).toHaveLength(1)
  })

  it('stops watching when it is killed, and forgets what it saw', () => {
    start({ host, ...around() })
    open('Projects')
    expect(attention.activity().opened.size).toBe(1)

    processes.kill(ATTENTION_PROCESS)

    expect(attention.activity().opened.size).toBe(0)
    open('Experience')
    expect(attention.activity().opened.size, 'still watching after being killed').toBe(0)
  })

  /*
   * The promise the whole design rests on: noticing never causes a download.
   * It asks whether a model is up and takes no for an answer.
   */
  it('never asks for a model, only whether there is one', () => {
    const modelWarm = vi.fn(() => false)
    start({ host, ...around({ modelWarm }) })
    open('Projects')

    expect(processes.list().map((p) => p.name)).toEqual([ATTENTION_PROCESS])
  })
})
