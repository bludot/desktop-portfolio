import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import { score, search, GROUP_ORDER } from '../src/components/Launcher/results'
import { calculate, formatAnswer } from '../src/components/Launcher/math'
import Launcher from '../src/components/Launcher'

jss.setup(preset())
jss.use(nested())

const app = (over: Record<string, unknown> = {}) =>
  ({
    id: 'whisker',
    name: 'Whisker',
    host: 'whisker.kaimu.app',
    url: 'https://whisker.kaimu.app',
    blurb: 'a whiteboard',
    icon: '/apps/whisker.svg',
    ...over,
  }) as any

const repo = (over: Record<string, unknown> = {}) =>
  ({
    id: 1,
    name: 'whisker',
    owner: 'ThatCatDev',
    description: 'a whiteboard',
    language: 'TypeScript',
    stars: 0,
    url: '',
    homepage: '',
    pushedAt: '',
    createdAt: '',
    size: 0,
    archived: false,
    ...over,
  }) as any

const win = (title: string, minimized = false) =>
  ({ window: { restore: vi.fn(), onActive: vi.fn() }, title, active: false, minimized }) as any

const sources = (over: Record<string, unknown> = {}) => ({
  apps: [],
  windows: [],
  repos: [],
  actions: [],
  openApp: vi.fn(),
  showWindow: vi.fn(),
  openRepo: vi.fn(),
  copy: vi.fn(),
  searchWeb: vi.fn(),
  ...over,
})

describe('score', () => {
  /*
   * Four tiers rather than a fuzzy distance. A portfolio has tens of things in
   * it, not thousands, and a ranking somebody can predict beats one that is
   * marginally better at guessing.
   */
  it('ranks the start of a name above a word inside it, above anywhere', () => {
    const prefix = score('whi', 'whisker')
    const boundary = score('server', 'whisker-server')
    const anywhere = score('isk', 'whisker')
    const subtitleOnly = score('cat', 'whisker', 'ThatCatDev')

    expect(prefix).toBeGreaterThan(boundary)
    expect(boundary).toBeGreaterThan(anywhere)
    expect(anywhere).toBeGreaterThan(subtitleOnly)
    expect(subtitleOnly).toBeGreaterThan(-1)
  })

  it('says no rather than nearly for something that does not match', () => {
    expect(score('zzz', 'whisker', 'ThatCatDev')).toBe(-1)
  })

  it('ignores case', () => {
    expect(score('WHIS', 'whisker')).toBeGreaterThan(0)
  })

  // A query is user input and reaches a RegExp, so it has to survive being one.
  it('treats regex characters as text', () => {
    expect(() => score('c++', 'C++ thing')).not.toThrow()
    expect(score('c++', 'C++ thing')).toBeGreaterThan(0)
    expect(score('.*', 'whisker')).toBe(-1)
  })
})

describe('search', () => {
  it('groups results in a fixed order, whatever their scores', () => {
    const results = search('whisker', sources({
      apps: [app()],
      windows: [win('whisker')],
      repos: [repo()],
      actions: [{ id: 'a', name: 'whisker action', run: vi.fn() }],
    }))

    const seen = results.map((r) => r.group).filter((g, i, all) => all.indexOf(g) === i)
    // A subsequence of the fixed order — not every group answers every query.
    expect(seen).toEqual(GROUP_ORDER.filter((g) => seen.includes(g)))
  })

  /*
   * The resting state is about what is open and what can be done, not about
   * everything that has ever been written — eighty-seven repositories unasked
   * for is a list rather than an answer.
   */
  it('leaves repositories out until they are asked for', () => {
    const withoutQuery = search('', sources({ apps: [app()], repos: [repo()] }))
    expect(withoutQuery.some((r) => r.group === 'Projects')).toBe(false)

    const withQuery = search('whisker', sources({ apps: [app()], repos: [repo()] }))
    expect(withQuery.some((r) => r.group === 'Projects')).toBe(true)
  })

  it('caps how many repositories one query can contribute', () => {
    const many = Array.from({ length: 30 }, (_, i) => repo({ id: i, name: `anime-${i}` }))
    const results = search('anime', sources({ repos: many }))
    expect(results.filter((r) => r.group === 'Projects').length).toBeLessThanOrEqual(6)
  })

  it('marks a minimised window, so it is known before it is chosen', () => {
    const results = search('', sources({ windows: [win('About', true)] }))
    expect(results[0].badge).toBe('minimised')
  })

  it('marks a repository that has somewhere to visit', () => {
    const results = search('whisker', sources({
      repos: [repo({ homepage: 'https://whisker.kaimu.app' })],
    }))
    expect(results[0].badge).toBe('live')
  })

  it('runs the thing it stands for', () => {
    const openApp = vi.fn()
    const results = search('whisker', sources({ apps: [app()], openApp }))
    results[0].run()
    expect(openApp).toHaveBeenCalled()
  })
})

describe('Launcher', () => {
  let host: HTMLElement
  let desktop: any
  let actions: any
  let launcher: Launcher

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
    desktop = { getElement: () => host }
    actions = {
      toggleTheme: vi.fn(),
      showAll: vi.fn(),
      minimizeAll: vi.fn(),
      settings: vi.fn(),
      openProjects: vi.fn(),
    }
    launcher = new Launcher(desktop, actions)
  })

  afterEach(async () => {
    if (launcher.parent) await launcher.unload()
    host.remove()
  })

  const rows = () => [...host.querySelectorAll('.launcher-row')]

  it('opens closed, and shows the apps and actions at rest', async () => {
    await launcher.load(host)
    expect(launcher.isOpen()).toBe(false)

    await launcher.show()
    expect(launcher.isOpen()).toBe(true)
    expect(rows().length).toBeGreaterThan(0)
    expect(host.textContent).toContain('Apps')
  })

  it('closes on Escape', async () => {
    await launcher.load(host)
    await launcher.show()

    launcher
      .getElement()
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(launcher.isOpen()).toBe(false)
  })

  // A shortcut is the whole point of a palette, and a window's own text field
  // would otherwise eat the key first — hence capture at the window.
  it('opens on the shortcut, from anywhere', async () => {
    await launcher.load(host)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    expect(launcher.isOpen()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    expect(launcher.isOpen()).toBe(false)
  })

  it('moves the highlight with the arrows, and wraps', async () => {
    await launcher.load(host)
    await launcher.show()

    const active = () => rows().findIndex((r) => r.classList.contains('is-active'))
    expect(active()).toBe(0)

    const press = (key: string) =>
      launcher.getElement().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))

    press('ArrowDown')
    expect(active()).toBe(1)

    // Holding one arrow should always reach everything.
    press('ArrowUp')
    press('ArrowUp')
    expect(active()).toBe(rows().length - 1)
  })

  it('runs the highlighted result on Enter, and closes', async () => {
    await launcher.load(host)
    await launcher.show()

    const input = host.querySelector<HTMLInputElement>('.launcher-input')!
    input.value = 'settings'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    launcher
      .getElement()
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(actions.settings).toHaveBeenCalled()
    expect(launcher.isOpen()).toBe(false)
  })

  /*
   * "Nothing matched" is now answered rather than announced: the web search is
   * the last group, so an unrecognised query still leads somewhere.
   */
  it('falls back to a web search when nothing here matches', async () => {
    await launcher.load(host)
    await launcher.show()

    const input = host.querySelector<HTMLInputElement>('.launcher-input')!
    input.value = 'zzzzzz'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(rows()).toHaveLength(1)
    expect(rows()[0].textContent).toContain('zzzzzz')
    expect(host.querySelector('.launcher-empty.is-shown')).toBeNull()
  })

  // One character is not worth searching for, and there the panel does have to
  // say something rather than show nothing.
  it('says so when there is genuinely nothing to show', async () => {
    await launcher.load(host)
    await launcher.show()

    const input = host.querySelector<HTMLInputElement>('.launcher-input')!
    input.value = 'z'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(rows()).toHaveLength(0)
    expect(host.querySelector('.launcher-empty')?.textContent).toContain('z')
  })

  it('answers a sum inline, above everything else', async () => {
    await launcher.load(host)
    await launcher.show()

    const input = host.querySelector<HTMLInputElement>('.launcher-input')!
    input.value = '12 * 12'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(rows()[0].textContent).toContain('144')
  })

  it('stops listening for the shortcut once unloaded', async () => {
    await launcher.load(host)
    await launcher.unload()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    expect(launcher.isOpen()).toBe(false)
  })
})

/*
 * Parsed, never evaluated. The query comes from a text field and could as
 * easily come from a URL one day, and "it is only my own site" is the reasoning
 * behind most of the interesting bugs.
 */
describe('calculate', () => {
  it('does arithmetic, with the usual precedence', () => {
    expect(calculate('2+2')).toBe(4)
    expect(calculate('2 + 3 * 4')).toBe(14)
    expect(calculate('(2 + 3) * 4')).toBe(20)
    expect(calculate('10 / 4')).toBe(2.5)
    expect(calculate('7 % 3')).toBe(1)
  })

  it('reads powers right to left, as they are written on paper', () => {
    expect(calculate('2^3^2')).toBe(512)
  })

  it('handles signs and decimals', () => {
    expect(calculate('-4 + 1')).toBe(-3)
    expect(calculate('3 * -2')).toBe(-6)
    expect(calculate('0.1 + 0.2')).toBeCloseTo(0.3, 10)
  })

  it('knows a few functions and constants', () => {
    expect(calculate('sqrt(16)')).toBe(4)
    expect(calculate('max(3, 9, 4)')).toBe(9)
    expect(calculate('round(2.6)')).toBe(3)
    expect(calculate('2 * pi')).toBeCloseTo(Math.PI * 2, 10)
  })

  it('tolerates a trailing equals, the way people type it', () => {
    expect(calculate('2+2=')).toBe(4)
  })

  /*
   * A launcher asks this of everything anybody types, so saying no has to be
   * ordinary and quiet — and a bare number is a name as often as a sum.
   */
  it('says no to anything that is not a sum', () => {
    expect(calculate('whisker')).toBeNull()
    expect(calculate('12')).toBeNull()
    expect(calculate('')).toBeNull()
    expect(calculate('2 +')).toBeNull()
    expect(calculate('1.2.3 + 1')).toBeNull()
    expect(calculate('alert(1)')).toBeNull()
    expect(calculate('anime-api')).toBeNull()
  })

  // It can only ever produce a number: there is nothing here that reaches the
  // page, whatever is typed.
  it('cannot be talked into running anything', () => {
    expect(calculate('constructor')).toBeNull()
    expect(calculate('window.alert(1)')).toBeNull()
    expect(calculate('[].constructor(1)')).toBeNull()
  })

  it('divides by zero the way arithmetic does, without an answer', () => {
    expect(calculate('1/0')).toBeNull()
  })
})

describe('formatAnswer', () => {
  it('groups long integers and trims long decimals', () => {
    expect(formatAnswer(1234567)).toBe('1,234,567')
    expect(formatAnswer(1 / 3)).toBe('0.3333333333')
  })

  it('keeps exponent form where rounding would print a wall of zeroes', () => {
    expect(formatAnswer(1e20)).toContain('e+')
    expect(formatAnswer(0.0000001)).toContain('e-')
  })
})

describe('the answer and the web fallback', () => {
  it('puts a sum first, above everything else', () => {
    const results = search('2+2', sources({ apps: [app()] }))
    expect(results[0].group).toBe('Answer')
    expect(results[0].name).toBe('4')
  })

  it('copies the answer when it is chosen', () => {
    const copy = vi.fn()
    const results = search('2+2', sources({ copy }))
    results[0].run()
    expect(copy).toHaveBeenCalledWith('4')
  })

  // The last resort belongs last: it is what to do when nothing here was it.
  it('offers a web search at the bottom', () => {
    const results = search('something obscure', sources({ apps: [app()] }))
    expect(results[results.length - 1].group).toBe('Web')
  })

  it('does not offer to search for a single character', () => {
    const results = search('a', sources({}))
    expect(results.some((r) => r.group === 'Web')).toBe(false)
  })

  it('hands the query to the search, untouched', () => {
    const searchWeb = vi.fn()
    const results = search('rust & go', sources({ searchWeb }))
    results.find((r) => r.group === 'Web')!.run()
    expect(searchWeb).toHaveBeenCalledWith('rust & go')
  })
})
