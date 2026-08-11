import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import { notify, onNotify, resetNotifications, type Notification } from '../src/notifications'
import { showNotifications, clearToasts, posted } from '../src/components/Toast/stack'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

const say = (over: Partial<Notification> = {}): Notification => ({
  sender: 'Projects',
  glyph: 'projects',
  title: 'GitHub is not answering',
  text: 'Showing what was cached an hour ago.',
  ...over,
})

const cards = () => host.querySelectorAll('.toast')
/**
 * In the order they were said. The column is `column-reverse`, so the last of
 * these is the one drawn at the top — a distinction no query can see, and the
 * reason ordering is a stylesheet's job rather than a script's.
 */
const titles = () => [...host.querySelectorAll('.toast-title')].map((t) => t.textContent)
/** Let the mount and its entrance settle. */
const settle = () => vi.advanceTimersByTimeAsync(20)

beforeEach(() => {
  vi.useFakeTimers()
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  clearToasts()
  resetNotifications()
  host.remove()
  vi.useRealTimers()
})

/*
 * The point of the bus: a window deep in the tree can say something without
 * being handed a place to say it, and without knowing a toast exists.
 */
describe('saying something from anywhere', () => {
  it('reaches the surface with nothing passed between them', async () => {
    showNotifications(host)
    notify(say())
    await settle()

    expect(cards()).toHaveLength(1)
    expect(host.querySelector('.toast-title')?.textContent).toBe('GitHub is not answering')
    expect(host.querySelector('.toast-from')?.textContent).toBe('Projects')
  })

  /*
   * The desktop mounts the surface partway through its own startup, and a
   * window with something to say during boot should not lose it for speaking
   * first.
   */
  it('holds what was said before anything was listening', async () => {
    notify(say({ title: 'Said during boot' }))
    showNotifications(host)
    await settle()

    expect(titles()).toEqual(['Said during boot'])
  })

  it('keeps the held ones in the order they were said', async () => {
    notify(say({ title: 'First' }))
    notify(say({ title: 'Second' }))
    showNotifications(host)
    await settle()

    // Said first, said second — and drawn the other way up.
    expect(titles()).toEqual(['First', 'Second'])
  })

  // A backlog is a short gap, not a mailbox. Fifty arriving at once would be
  // worse than the five that were dropped.
  it('does not hold an unbounded backlog', async () => {
    for (let i = 0; i < 9; i += 1) notify(say({ title: `Held ${i}` }))
    showNotifications(host)
    await settle()

    expect(cards().length).toBeLessThanOrEqual(3)
  })

  it('stops drawing when the surface unsubscribes', async () => {
    const surface = showNotifications(host)
    surface.unsubscribe()
    notify(say())
    await settle()

    expect(cards()).toHaveLength(0)
  })
})

describe('the stack', () => {
  it('shows several at once, newest at the top', async () => {
    showNotifications(host)
    notify(say({ title: 'One' }))
    await settle()
    notify(say({ title: 'Two' }))
    await settle()

    expect(titles()).toEqual(['One', 'Two'])
  })

  /*
   * Three is where a corner stops being a corner. A fourth pushes the oldest
   * out rather than growing the column — something that grows without limit is
   * a log, and a log belongs in a window.
   */
  it('never holds more than three', async () => {
    showNotifications(host)
    for (const title of ['One', 'Two', 'Three', 'Four']) {
      notify(say({ title }))
      await settle()
    }

    expect(cards()).toHaveLength(3)
    expect(titles()).toEqual(['Two', 'Three', 'Four'])
  })

  it('closes the gap when one in the middle is dismissed', async () => {
    showNotifications(host)
    for (const title of ['One', 'Two', 'Three']) {
      notify(say({ title }))
      await settle()
    }

    // The middle card of three: 'Two'.
    const middle = [...host.querySelectorAll('.toast')][1]
    middle.querySelector<HTMLButtonElement>('.toast-close')!.click()
    await settle()

    expect(titles()).toEqual(['One', 'Three'])
    expect(posted()).toHaveLength(2)
  })

  it('empties as each one runs out of time', async () => {
    showNotifications(host)
    notify(say({ title: 'One' }))
    await settle()

    await vi.advanceTimersByTimeAsync(12_000)
    expect(cards()).toHaveLength(0)
    expect(posted()).toHaveLength(0)
  })
})

describe('taking a message back', () => {
  /*
   * A thing worth saying can stop being worth saying — the repositories start
   * answering again, or the process that offered a tip is killed while the tip
   * is still up.
   */
  it('lets the poster withdraw what it said', async () => {
    showNotifications(host)
    let withdraw: (() => void) | undefined
    notify(say({ onShown: (dismiss) => { withdraw = dismiss } }))
    await settle()
    expect(cards()).toHaveLength(1)

    withdraw!()
    await settle()

    expect(cards()).toHaveLength(0)
  })

  it('tells the poster when it goes, and whether it was taken', async () => {
    showNotifications(host)
    const gone = vi.fn()
    notify(say({ action: { label: 'Open it', run: vi.fn() }, onGone: gone }))
    await settle()

    host.querySelector<HTMLButtonElement>('.toast-do')!.click()
    await settle()

    expect(gone).toHaveBeenCalledWith(true)
  })

  it('says it was not taken when it is only dismissed', async () => {
    showNotifications(host)
    const gone = vi.fn()
    notify(say({ onGone: gone }))
    await settle()

    host.querySelector<HTMLButtonElement>('.toast-close')!.click()
    await settle()

    expect(gone).toHaveBeenCalledWith(false)
  })
})

describe('the bus itself', () => {
  it('hands back a way to stop listening', () => {
    const heard: string[] = []
    const handle = onNotify((n) => heard.push(n.title))

    notify(say({ title: 'Heard' }))
    handle.unsubscribe()
    notify(say({ title: 'Not heard' }))

    expect(heard).toEqual(['Heard'])
  })
})
