import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import ProjectsContent, { metaLine } from '../src/contents/projects'
import { fetchRepos, loadRepos, CACHE_TTL_MS, ACCOUNTS } from '../src/utils/github'
import db, { readCache, writeCache } from '../src/Store'

jss.setup(preset())
jss.use(nested())

const repo = (over: Record<string, unknown> = {}) => ({
  id: Math.floor(Math.random() * 1e6),
  name: 'thing',
  owner: { login: 'bludot' },
  description: 'does a thing',
  language: 'Go',
  stargazers_count: 0,
  html_url: 'https://github.com/bludot/thing',
  pushed_at: '2026-01-01T00:00:00Z',
  fork: false,
  archived: false,
  ...over,
})

/** Answers each account in the order ACCOUNTS lists them. */
const serve = (byAccount: Record<string, unknown[] | Error | undefined>) => {
  const fetchMock = vi.fn(async (url: string) => {
    const account = ACCOUNTS.find((a) => url.includes(`/users/${a}/`))!
    const answer = byAccount[account]
    if (answer instanceof Error) throw answer
    if (answer === undefined) return { ok: false, status: 404, json: async () => ({}) }
    return { ok: true, status: 200, json: async () => answer }
  })
  ;(globalThis as any).fetch = fetchMock
  return fetchMock
}

beforeEach(async () => {
  await db.cache.clear()
})

afterEach(() => {
  delete (globalThis as any).fetch
  vi.restoreAllMocks()
})

describe('fetchRepos', () => {
  it('merges the accounts, newest push first', async () => {
    serve({
      thatcatdev: [repo({ name: 'old', pushed_at: '2024-01-01T00:00:00Z' })],
      'weeb-vip': [repo({ name: 'newest', pushed_at: '2026-08-01T00:00:00Z' })],
      bludot: [repo({ name: 'middle', pushed_at: '2025-06-01T00:00:00Z' })],
    })

    const { repos } = await fetchRepos()
    expect(repos.map((r) => r.name)).toEqual(['newest', 'middle', 'old'])
  })

  /*
   * A fork is someone else's work with his name on the copy, so it stays out of
   * a portfolio — but it is counted, so the list is not quietly shorter than
   * the account is.
   */
  it('leaves forks out and says how many', async () => {
    serve({
      thatcatdev: [repo({ name: 'mine' }), repo({ name: 'theirs', fork: true })],
      'weeb-vip': [],
      bludot: [],
    })

    const { repos, forksHidden } = await fetchRepos()
    expect(repos.map((r) => r.name)).toEqual(['mine'])
    expect(forksHidden).toBe(1)
  })

  it('keeps only the fields the window shows', async () => {
    serve({
      thatcatdev: [
        repo({ name: 'tanrenai', language: 'Go', stargazers_count: 3, archived: true }),
      ],
      'weeb-vip': [],
      bludot: [],
    })

    const { repos } = await fetchRepos()
    expect(repos[0]).toEqual({
      id: expect.any(Number),
      name: 'tanrenai',
      owner: 'bludot',
      description: 'does a thing',
      language: 'Go',
      stars: 3,
      url: 'https://github.com/bludot/thing',
      pushedAt: '2026-01-01T00:00:00Z',
      archived: true,
    })
  })

  it('copes with nulls, which GitHub sends for a repo with no description', async () => {
    serve({
      thatcatdev: [repo({ description: null, language: null })],
      'weeb-vip': [],
      bludot: [],
    })

    const { repos } = await fetchRepos()
    expect(repos[0].description).toBe('')
    expect(repos[0].language).toBe('')
  })

  // One account being unreachable should cost that account, not the window.
  it('returns what it got and names what it did not', async () => {
    serve({
      thatcatdev: [repo({ name: 'survived' })],
      'weeb-vip': new Error('network'),
      bludot: undefined,
    })

    const { repos, failed } = await fetchRepos()
    expect(repos.map((r) => r.name)).toEqual(['survived'])
    expect(failed.sort()).toEqual(['bludot', 'weeb-vip'])
  })

  it('throws only when every account fails', async () => {
    serve({
      thatcatdev: new Error('network'),
      'weeb-vip': new Error('network'),
      bludot: new Error('network'),
    })

    await expect(fetchRepos()).rejects.toThrow('Could not reach GitHub')
  })
})

describe('loadRepos', () => {
  const fresh = { repos: [], forksHidden: 0, failed: [] }

  it('spends nothing when the cache is recent enough', async () => {
    await writeCache('github:repos', { ...fresh, forksHidden: 7 }, 1_000)
    const fetchMock = serve({ thatcatdev: [], 'weeb-vip': [], bludot: [] })

    const result = await loadRepos({ now: 1_000 + CACHE_TTL_MS - 1 })
    expect(result.cached).toBe(true)
    expect(result.forksHidden).toBe(7)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('goes back to GitHub once the cache is stale', async () => {
    await writeCache('github:repos', fresh, 1_000)
    const fetchMock = serve({
      thatcatdev: [repo({ name: 'new' })],
      'weeb-vip': [],
      bludot: [],
    })

    const result = await loadRepos({ now: 1_000 + CACHE_TTL_MS + 1 })
    expect(result.cached).toBe(false)
    expect(result.repos.map((r) => r.name)).toEqual(['new'])
    expect(fetchMock).toHaveBeenCalledTimes(ACCOUNTS.length)
  })

  it('refetches on demand even when the cache is warm', async () => {
    await writeCache('github:repos', fresh, 1_000)
    const fetchMock = serve({ thatcatdev: [], 'weeb-vip': [], bludot: [] })

    await loadRepos({ force: true, now: 1_000 })
    expect(fetchMock).toHaveBeenCalledTimes(ACCOUNTS.length)
  })

  /*
   * A list from this morning beats an error page, so a network failure falls
   * back to whatever is stored however old it is.
   */
  it('falls back to a stale cache rather than failing', async () => {
    await writeCache('github:repos', { ...fresh, forksHidden: 4 }, 1_000)
    serve({
      thatcatdev: new Error('offline'),
      'weeb-vip': new Error('offline'),
      bludot: new Error('offline'),
    })

    const result = await loadRepos({ now: 1_000 + CACHE_TTL_MS * 10 })
    expect(result.cached).toBe(true)
    expect(result.forksHidden).toBe(4)
  })

  it('gives up only when there is nothing to fall back on', async () => {
    serve({
      thatcatdev: new Error('offline'),
      'weeb-vip': new Error('offline'),
      bludot: new Error('offline'),
    })

    await expect(loadRepos({ now: 1 })).rejects.toThrow()
  })

  it('stores what it fetched, for the next visit', async () => {
    serve({ thatcatdev: [repo({ name: 'kept' })], 'weeb-vip': [], bludot: [] })

    await loadRepos({ now: 5_000 })
    const cached = await readCache<{ repos: { name: string }[] }>('github:repos')
    expect(cached?.value.repos.map((r) => r.name)).toEqual(['kept'])
  })
})

describe('metaLine', () => {
  const base = {
    id: 1,
    name: 'x',
    owner: 'bludot',
    description: '',
    url: '',
    archived: false,
  }

  it('says only what is there', () => {
    expect(metaLine({ ...base, language: 'Go', stars: 4, pushedAt: '2026-08-05T00:00:00Z' }))
      .toBe('Go · 4★ · 2026/08')
    expect(metaLine({ ...base, language: '', stars: 0, pushedAt: '' })).toBe('')
    expect(metaLine({ ...base, language: 'Rust', stars: 0, pushedAt: '' })).toBe('Rust')
  })
})

describe('Projects window', () => {
  let host: HTMLElement
  let content: ProjectsContent

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
  })

  afterEach(async () => {
    await content?.unload()
    host.remove()
  })

  const open = async () => {
    content = new ProjectsContent()
    await content.load(host)
    await vi.waitFor(() =>
      expect(host.querySelector('.projects-count')).toBeTruthy(),
    )
  }

  it('lists what came back, with a summary', async () => {
    serve({
      thatcatdev: [repo({ name: 'tanrenai', owner: { login: 'ThatCatDev' } })],
      'weeb-vip': [repo({ name: 'anime-api', owner: { login: 'weeb-vip' } })],
      bludot: [repo({ name: 'forked', fork: true })],
    })
    await open()

    expect(host.querySelectorAll('.project')).toHaveLength(2)
    expect(host.querySelector('.projects-count')?.textContent).toBe(
      '2 repos · 1 forks hidden',
    )
  })

  /*
   * Regression: the accounts are lowercase but GitHub returns the login as
   * "ThatCatDev", so a case-sensitive filter showed an empty list.
   */
  it('filters by account whatever case the login came back in', async () => {
    serve({
      thatcatdev: [repo({ name: 'tanrenai', owner: { login: 'ThatCatDev' } })],
      'weeb-vip': [repo({ name: 'anime-api', owner: { login: 'weeb-vip' } })],
      bludot: [],
    })
    await open()

    const filter = (label: string) =>
      [...host.querySelectorAll('.projects-filters button')].find(
        (b) => b.textContent === label,
      ) as HTMLElement

    filter('thatcatdev').click()
    expect(host.querySelectorAll('.project')).toHaveLength(1)
    expect(host.querySelector('.project-name')?.textContent).toContain('tanrenai')

    filter('All').click()
    expect(host.querySelectorAll('.project')).toHaveLength(2)
  })

  it('marks an archived repository', async () => {
    serve({
      thatcatdev: [repo({ name: 'old', archived: true })],
      'weeb-vip': [],
      bludot: [],
    })
    await open()

    expect(host.querySelector('.project-archived')?.textContent).toBe('Archived')
  })

  it('opens each repository on GitHub, safely', async () => {
    serve({ thatcatdev: [repo()], 'weeb-vip': [], bludot: [] })
    await open()

    const link = host.querySelector<HTMLAnchorElement>('.project')!
    expect(link.href).toBe('https://github.com/bludot/thing')
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noopener noreferrer')
  })

  it('says when GitHub could not be reached, and offers to try again', async () => {
    serve({
      thatcatdev: new Error('offline'),
      'weeb-vip': new Error('offline'),
      bludot: new Error('offline'),
    })

    content = new ProjectsContent()
    await content.load(host)
    await vi.waitFor(() =>
      expect(host.querySelector('.projects-retry')).toBeTruthy(),
    )
    expect(host.querySelector('.projects-note')?.textContent).toContain(
      'could not be reached',
    )

    // Retry, this time with GitHub answering.
    serve({ thatcatdev: [repo({ name: 'back' })], 'weeb-vip': [], bludot: [] })
    host.querySelector<HTMLElement>('.projects-retry')!.click()

    await vi.waitFor(() => expect(host.querySelectorAll('.project')).toHaveLength(1))
  })

  it('says so when an account has nothing to show', async () => {
    serve({ thatcatdev: [], 'weeb-vip': [], bludot: [] })
    await open()

    expect(host.querySelector('.projects-note')?.textContent).toBe('Nothing here.')
  })
})
