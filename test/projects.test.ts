import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import ProjectsContent, { metaLine, statsLine } from '../src/contents/projects'
import {
  fetchRepos,
  forgetGithubFailure,
  loadRepos,
  summarise,
  CACHE_TTL_MS,
  CACHE_KEY,
  ACCOUNTS,
} from '../src/utils/github'
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
const serve = (
  byAccount: Record<string, unknown[] | Error | undefined>,
  detail: { readme?: string; languages?: Record<string, number> } = {},
) => {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.includes('/readme')) {
      return detail.readme === undefined
        ? { ok: false, status: 404, text: async () => '' }
        : { ok: true, status: 200, text: async () => detail.readme! }
    }
    if (url.includes('/languages')) {
      return { ok: true, status: 200, json: async () => detail.languages ?? {} }
    }
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
  // Module-level state: without this, one test's refusal is remembered by the
  // next, which is the same trap the back-off exists to spring on GitHub.
  forgetGithubFailure()
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
        repo({
          name: 'tanrenai',
          language: 'Go',
          stargazers_count: 3,
          archived: true,
          created_at: '2026-01-01T00:00:00Z',
          homepage: 'https://tanren.ai',
        }),
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
      homepage: 'https://tanren.ai',
      pushedAt: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      size: 0,
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
    await writeCache(CACHE_KEY, { ...fresh, forksHidden: 7 }, 1_000)
    const fetchMock = serve({ thatcatdev: [], 'weeb-vip': [], bludot: [] })

    const result = await loadRepos({ now: 1_000 + CACHE_TTL_MS - 1 })
    expect(result.cached).toBe(true)
    expect(result.forksHidden).toBe(7)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('goes back to GitHub once the cache is stale', async () => {
    await writeCache(CACHE_KEY, fresh, 1_000)
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
    await writeCache(CACHE_KEY, fresh, 1_000)
    const fetchMock = serve({ thatcatdev: [], 'weeb-vip': [], bludot: [] })

    await loadRepos({ force: true, now: 1_000 })
    expect(fetchMock).toHaveBeenCalledTimes(ACCOUNTS.length)
  })

  /*
   * A list from this morning beats an error page, so a network failure falls
   * back to whatever is stored however old it is.
   */
  it('falls back to a stale cache rather than failing', async () => {
    await writeCache(CACHE_KEY, { ...fresh, forksHidden: 4 }, 1_000)
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
    const cached = await readCache<{ repos: { name: string }[] }>(CACHE_KEY)
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
    homepage: '',
    createdAt: '',
    size: 0,
    archived: false,
  }

  it('says only what is there', () => {
    expect(metaLine({ ...base, language: 'Go', stars: 4, pushedAt: '2026-08-05T00:00:00Z' }))
      .toBe('Go · 4★ · 2026/08')
    expect(metaLine({ ...base, language: '', stars: 0, pushedAt: '' })).toBe('')
    expect(metaLine({ ...base, language: 'Rust', stars: 0, pushedAt: '' })).toBe('Rust')
  })
})

describe('summarise', () => {
  const made = (over: Record<string, unknown> = {}) => ({
    id: 1,
    name: 'r',
    owner: 'bludot',
    description: '',
    language: 'Go',
    stars: 0,
    url: '',
    homepage: '',
    pushedAt: '2026-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    size: 0,
    archived: false,
    ...over,
  })

  it('adds up the count and the stars', () => {
    const summary = summarise([made({ stars: 3 }), made({ stars: 4 })])
    expect(summary.count).toBe(2)
    expect(summary.stars).toBe(7)
  })

  it('ranks the three languages it reaches for most', () => {
    const summary = summarise([
      made({ language: 'Go' }),
      made({ language: 'Go' }),
      made({ language: 'TypeScript' }),
      made({ language: 'TypeScript' }),
      made({ language: 'HCL' }),
      made({ language: 'Rust' }),
    ])
    // Go and TypeScript are level, so they fall back to alphabetical rather
    // than to whatever order the map happened to be built in.
    expect(summary.languages).toEqual(['Go', 'TypeScript', 'HCL'])
  })

  it('ignores repositories GitHub has no language for', () => {
    expect(summarise([made({ language: '' }), made({ language: 'Go' })]).languages)
      .toEqual(['Go'])
  })

  it('spans from the earliest creation to the latest push', () => {
    const summary = summarise([
      made({ createdAt: '2012-08-20T00:00:00Z', pushedAt: '2015-01-01T00:00:00Z' }),
      made({ createdAt: '2021-01-01T00:00:00Z', pushedAt: '2026-08-01T00:00:00Z' }),
    ])
    expect(summary.firstYear).toBe('2012')
    expect(summary.lastYear).toBe('2026')
  })

  // Entries cached before createdAt existed have only a push date to go on.
  it('falls back to the push date when there is no creation date', () => {
    expect(summarise([made({ createdAt: '', pushedAt: '2019-05-05T00:00:00Z' })]).firstYear)
      .toBe('2019')
  })

  it('says nothing rather than something wrong about an empty account', () => {
    expect(summarise([])).toEqual({
      count: 0,
      stars: 0,
      languages: [],
      firstYear: '',
      lastYear: '',
    })
  })
})

describe('statsLine', () => {
  const summary = {
    count: 20,
    stars: 1,
    languages: ['Go', 'TypeScript'],
    firstYear: '2021',
    lastYear: '2026',
  }

  it('reads as one line', () => {
    expect(statsLine(summary)).toBe('20 repos · 1★ · Go, TypeScript · 2021–2026')
  })

  it('leaves out what is not there', () => {
    expect(
      statsLine({ count: 1, stars: 0, languages: [], firstYear: '', lastYear: '' }),
    ).toBe('1 repo')
  })

  it('does not print a span of one year twice', () => {
    expect(
      statsLine({ ...summary, firstYear: '2026', lastYear: '2026' }),
    ).toContain('· 2026')
    expect(statsLine({ ...summary, firstYear: '2026', lastYear: '2026' })).not.toContain('2026–2026')
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

  /*
   * The window covers this pane until GitHub has answered — see the splash
   * tests for the cover itself. All this content owes it is the mark, the words
   * the default cannot know, and a promise that settles when the read is over.
   */
  describe('what the window waits on', () => {
    it('asks for GitHub\'s mark in place of the default', () => {
      content = new ProjectsContent()
      const splash = content.splash as Exclude<typeof content.splash, false>

      expect(splash.label).toBe('Reading GitHub…')
      expect((splash.icon as Element)?.tagName.toLowerCase()).toBe('svg')
    })

    it('is ready once the read has landed', async () => {
      serve({ thatcatdev: [repo()], 'weeb-vip': [], bludot: [] })
      await open()

      await expect(content.ready).resolves.toBeUndefined()
    })

    /*
     * A failure has as much to show as a success — the reason, and the button
     * that tries again — and both are behind the cover until this settles.
     */
    it('is ready when the read failed, rather than staying covered', async () => {
      serve({
        thatcatdev: new Error('offline'),
        'weeb-vip': new Error('offline'),
        bludot: new Error('offline'),
      })
      content = new ProjectsContent()
      await content.load(host)

      await expect(content.ready).resolves.toBeUndefined()
      await vi.waitFor(() =>
        expect(host.querySelector('.projects-action')?.textContent).toBe('Try again'),
      )
    })

    /*
     * The cover already says "Reading GitHub…" over this pane, and the glass it
     * is made of shows what is underneath — so the same sentence appeared
     * twice. It is still drawn for a retry, which has no cover over it.
     */
    it('leaves the first read to the cover, and speaks for itself on a retry', async () => {
      serve({
        thatcatdev: new Error('offline'),
        'weeb-vip': new Error('offline'),
        bludot: new Error('offline'),
      })
      content = new ProjectsContent()
      const drawn = content.load(host)
      expect(host.querySelector('.projects-note')).toBeNull()
      await drawn

      await vi.waitFor(() =>
        expect(host.querySelector('.projects-action')).toBeTruthy(),
      )
      ;(host.querySelector('.projects-action') as HTMLElement).click()
      expect(host.querySelector('.projects-note')?.textContent).toBe('Reading GitHub…')
    })
  })

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

  /*
   * github.com cannot be framed — it sends `frame-ancestors 'none'` — so a
   * repository is read through the API and rendered here instead of linked to.
   */
  it('opens a repository inside the window rather than leaving', async () => {
    serve({ thatcatdev: [repo({ name: 'tanrenai' })], 'weeb-vip': [], bludot: [] }, {
      readme: '<h1>Tanrenai</h1><p>Local models.</p>',
      languages: { Go: 800, TypeScript: 200 },
    })
    await open()

    // A button, not a link: nothing here navigates away.
    const row = host.querySelector('.project')!
    expect(row.tagName).toBe('BUTTON')
    ;(row as HTMLElement).click()

    await vi.waitFor(() =>
      expect(host.querySelector('.detail-readme')?.textContent).toContain('Local models.'),
    )
    expect(host.querySelector('.detail-name')?.textContent).toContain('tanrenai')
    // The list is gone while a repository is open.
    expect(host.querySelectorAll('.project')).toHaveLength(0)
  })

  it('still offers the real thing, safely', async () => {
    serve({ thatcatdev: [repo()], 'weeb-vip': [], bludot: [] }, { readme: '<p>hi</p>' })
    await open()
    ;(host.querySelector('.project') as HTMLElement).click()

    await vi.waitFor(() => expect(host.querySelector('.detail-external')).toBeTruthy())
    const link = host.querySelector<HTMLAnchorElement>('.detail-external')!
    expect(link.href).toBe('https://github.com/bludot/thing')
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noopener noreferrer')
  })

  /*
   * Somebody reading about a project would rather see it than read its source.
   * Most of these have no site, so the link only exists when it leads
   * somewhere — and the row says so before you open it.
   */
  it('offers the running thing when there is one', async () => {
    serve(
      {
        thatcatdev: [repo({ name: 'kaimu', homepage: 'https://kaimu.vercel.app' })],
        'weeb-vip': [],
        bludot: [],
      },
      { readme: '<p>hi</p>' },
    )
    await open()

    expect(host.querySelector('.project-live')?.textContent).toBe('Live')
    ;(host.querySelector('.project') as HTMLElement).click()

    await vi.waitFor(() => expect(host.querySelector('.detail-visit')).toBeTruthy())
    const visit = host.querySelector<HTMLAnchorElement>('.detail-visit')!
    expect(visit.href).toBe('https://kaimu.vercel.app/')
    expect(visit.target).toBe('_blank')
    expect(visit.rel).toBe('noopener noreferrer')
  })

  it('says nothing about a site for a repository that has none', async () => {
    serve({ thatcatdev: [repo()], 'weeb-vip': [], bludot: [] }, { readme: '<p>hi</p>' })
    await open()

    expect(host.querySelector('.project-live')).toBeNull()
    ;(host.querySelector('.project') as HTMLElement).click()

    await vi.waitFor(() => expect(host.querySelector('.detail-external')).toBeTruthy())
    expect(host.querySelector('.detail-visit')).toBeNull()
  })

  /*
   * The refinements narrow whichever account is chosen. Each chip carries its
   * count, so a chip that would empty the list says so before it is pressed.
   */
  describe('filtering', () => {
    const mixed = () =>
      serve(
        {
          thatcatdev: [
            repo({ name: 'tanrenai', language: 'Go' }),
            repo({ name: 'kaimu', language: 'TypeScript', homepage: 'https://kaimu.app' }),
            repo({ name: 'old-thing', language: 'Go', archived: true }),
          ],
          'weeb-vip': [],
          bludot: [],
        },
        { readme: '<p>hi</p>' },
      )

    const chip = (label: string) =>
      [...host.querySelectorAll<HTMLButtonElement>('.projects-refine button')].find(
        (b) => b.textContent?.startsWith(label),
      )!

    const listed = () =>
      [...host.querySelectorAll('.project-name')].map(
        (n) => n.childNodes[0].textContent,
      )

    it('narrows to one language, and back out again on a second press', async () => {
      mixed()
      await open()
      expect(listed()).toHaveLength(3)

      chip('Go').click()
      expect(listed()).toEqual(['tanrenai', 'old-thing'])

      // A second press clears it, so the row needs no separate way out.
      chip('Go').click()
      expect(listed()).toHaveLength(3)
    })

    it('narrows to what is actually running', async () => {
      mixed()
      await open()

      chip('Live').click()
      expect(listed()).toEqual(['kaimu'])
    })

    it('hides archived work only when asked', async () => {
      mixed()
      await open()
      expect(listed()).toContain('old-thing')

      chip('Hide archived').click()
      expect(listed()).not.toContain('old-thing')
    })

    it('counts what each chip would leave, before it is pressed', async () => {
      mixed()
      await open()
      expect(chip('Go').querySelector('.refine-count')?.textContent).toBe('2')
      expect(chip('Live').querySelector('.refine-count')?.textContent).toBe('1')
    })

    // Two filters are an "and", not a race between them.
    it('applies the filters together', async () => {
      mixed()
      await open()

      chip('Live').click()
      chip('Go').click()
      expect(listed()).toHaveLength(0)
    })

    /*
     * A language chosen under one account usually does not exist under the
     * next, and leaving it set would show an empty list for no visible reason.
     */
    it('drops a language that the next account does not have', async () => {
      serve(
        {
          thatcatdev: [
            repo({ name: 'tanrenai', language: 'Go', owner: { login: 'ThatCatDev' } }),
          ],
          'weeb-vip': [
            repo({
              name: 'weeb-frontend',
              language: 'TypeScript',
              owner: { login: 'weeb-vip' },
            }),
          ],
          bludot: [],
        },
        { readme: '<p>hi</p>' },
      )
      await open()

      chip('Go').click()
      expect(listed()).toEqual(['tanrenai'])

      const rail = [...host.querySelectorAll<HTMLButtonElement>('.rail-item')].find(
        (b) => b.textContent?.startsWith('weeb-vip'),
      )!
      rail.click()
      expect(listed()).toEqual(['weeb-frontend'])
    })
  })

  it('goes back to the list', async () => {
    serve({ thatcatdev: [repo()], 'weeb-vip': [], bludot: [] }, { readme: '<p>hi</p>' })
    await open()
    ;(host.querySelector('.project') as HTMLElement).click()

    await vi.waitFor(() => expect(host.querySelector('.detail-back')).toBeTruthy())
    ;(host.querySelector('.detail-back') as HTMLElement).click()

    expect(host.querySelectorAll('.project')).toHaveLength(1)
    expect(host.querySelector('.detail-readme')).toBeNull()
  })

  it('says so when a repository has no README', async () => {
    serve({ thatcatdev: [repo()], 'weeb-vip': [], bludot: [] })   // readme 404s
    await open()
    ;(host.querySelector('.project') as HTMLElement).click()

    await vi.waitFor(() =>
      expect(host.querySelector('.detail-readme')?.textContent).toContain(
        'Nothing written down',
      ),
    )
  })

  it('shows the language split as proportions', async () => {
    serve({ thatcatdev: [repo()], 'weeb-vip': [], bludot: [] }, {
      readme: '<p>hi</p>',
      languages: { Go: 750, TypeScript: 250 },
    })
    await open()
    ;(host.querySelector('.project') as HTMLElement).click()

    await vi.waitFor(() => expect(host.querySelector('.detail-legend')).toBeTruthy())
    expect(host.querySelector('.detail-legend')?.textContent).toBe('Go 75%  ·  TypeScript 25%')
  })

  // A README is somebody else's markup arriving over the network.
  it('resolves a README\'s relative images against the repository', async () => {
    serve({ thatcatdev: [repo({ name: 'tanrenai', owner: { login: 'ThatCatDev' } })], 'weeb-vip': [], bludot: [] }, {
      readme: '<p><img src="resources/logo.png" alt="logo"></p>',
    })
    await open()
    ;(host.querySelector('.project') as HTMLElement).click()

    await vi.waitFor(() => expect(host.querySelector('.detail-readme img')).toBeTruthy())
    expect(host.querySelector<HTMLImageElement>('.detail-readme img')!.getAttribute('src')).toBe(
      'https://raw.githubusercontent.com/ThatCatDev/tanrenai/HEAD/resources/logo.png',
    )
  })

  /*
   * The accounts sit in a rail rather than in cards stacked above the list.
   * The window is wide and short; the cards were spending a quarter of its
   * height and leaving the width unused.
   */
  it('lists every account in the rail, with All first', async () => {
    serve({
      thatcatdev: [repo({ owner: { login: 'ThatCatDev' } })],
      'weeb-vip': [repo({ owner: { login: 'weeb-vip' } })],
      bludot: [repo()],
    })
    await open()

    const names = [...host.querySelectorAll('.rail-name')].map((n) => n.textContent)
    expect(names).toEqual(['All', 'thatcatdev', 'weeb-vip', 'bludot'])
  })

  it('counts each account against its own repositories', async () => {
    serve({
      thatcatdev: [repo({ owner: { login: 'ThatCatDev' } })],
      'weeb-vip': [
        repo({ owner: { login: 'weeb-vip' } }),
        repo({ owner: { login: 'weeb-vip' } }),
      ],
      bludot: [],
    })
    await open()

    const counts = [...host.querySelectorAll('.rail-count')].map((c) => c.textContent)
    expect(counts[0]).toBe('3 repos')
    expect(counts[1]).toContain('1')
    expect(counts[2]).toContain('2')
    expect(counts[3]).toContain('0')
  })

  // Read where it applies, rather than three of them at once.
  it('shows the note only under the account that is selected', async () => {
    serve({
      thatcatdev: [repo({ owner: { login: 'ThatCatDev' } })],
      'weeb-vip': [repo({ owner: { login: 'weeb-vip' } })],
      bludot: [],
    })
    await open()

    expect(host.querySelectorAll('.rail-note')).toHaveLength(0)

    const railFor = (label: string) =>
      [...host.querySelectorAll('.rail-item')].find(
        (item) => item.querySelector('.rail-name')?.textContent === label,
      ) as HTMLElement

    railFor('weeb-vip').click()

    const notes = [...host.querySelectorAll('.rail-note')]
    expect(notes).toHaveLength(1)
    expect(railFor('weeb-vip').contains(notes[0])).toBe(true)
    expect(notes[0].textContent).toContain('anime site')
  })

  it('filters the list from the rail', async () => {
    serve({
      thatcatdev: [repo({ name: 'tanrenai', owner: { login: 'ThatCatDev' } })],
      'weeb-vip': [repo({ name: 'anime-api', owner: { login: 'weeb-vip' } })],
      bludot: [],
    })
    await open()
    expect(host.querySelectorAll('.project')).toHaveLength(2)

    ;([...host.querySelectorAll('.rail-item')].find(
      (i) => i.querySelector('.rail-name')?.textContent === 'thatcatdev',
    ) as HTMLElement).click()

    expect(host.querySelectorAll('.project')).toHaveLength(1)
    expect(host.querySelector('.project-name')?.textContent).toContain('tanrenai')
  })

  // Once the rail has narrowed to one account, repeating it on every row is noise.
  it('drops the owner from each row when an account is selected', async () => {
    serve({
      thatcatdev: [repo({ owner: { login: 'ThatCatDev' } })],
      'weeb-vip': [],
      bludot: [],
    })
    await open()
    expect(host.querySelector('.project-owner')).toBeTruthy()

    ;([...host.querySelectorAll('.rail-item')].find(
      (i) => i.querySelector('.rail-name')?.textContent === 'thatcatdev',
    ) as HTMLElement).click()

    expect(host.querySelector('.project-owner')).toBeNull()
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
      expect(host.querySelector('.projects-action')).toBeTruthy(),
    )
    expect(host.querySelector('.projects-note')?.textContent).toContain(
      'could not be reached',
    )

    // Retry, this time with GitHub answering.
    serve({ thatcatdev: [repo({ name: 'back' })], 'weeb-vip': [], bludot: [] })
    host.querySelector<HTMLElement>('.projects-action')!.click()

    await vi.waitFor(() => expect(host.querySelectorAll('.project')).toHaveLength(1))
  })

  it('says so when an account has nothing to show', async () => {
    serve({ thatcatdev: [], 'weeb-vip': [], bludot: [] })
    await open()

    expect(host.querySelector('.projects-note')?.textContent).toBe('Nothing here.')
  })
})

/*
 * Three things want the repositories at once — the Projects window, the
 * launcher's search and the chat window's notes — against an API that allows
 * sixty requests an hour to an address that is not signed in. Asking three
 * times for one answer, and then asking again the moment it is refused, is how
 * a desktop spends the rest of the hour rate-limited.
 */
describe('asking GitHub once', () => {
  beforeEach(async () => {
    await db.cache.clear()
    forgetGithubFailure()
  })

  afterEach(() => {
    forgetGithubFailure()
  })

  it('shares one request between everything that asks together', async () => {
    const fetchMock = serve({ thatcatdev: [repo()], 'weeb-vip': [], bludot: [] })

    const [a, b, c] = await Promise.all([loadRepos(), loadRepos(), loadRepos()])

    // Three accounts, once — not three times each.
    expect(fetchMock.mock.calls).toHaveLength(ACCOUNTS.length)
    expect(a.repos).toEqual(b.repos)
    expect(b.repos).toEqual(c.repos)
  })

  it('leaves a refused API alone for a while afterwards', async () => {
    const offline = new Error('403 rate limited')
    const fetchMock = serve({
      thatcatdev: offline,
      'weeb-vip': offline,
      bludot: offline,
    })

    await expect(loadRepos({ now: 1_000 })).rejects.toThrow()
    const first = fetchMock.mock.calls.length

    // A second consumer arriving straight after does not try again.
    await expect(loadRepos({ now: 2_000 })).rejects.toThrow()
    expect(fetchMock.mock.calls).toHaveLength(first)

    // A minute later it is worth another go.
    await expect(loadRepos({ now: 90_000 })).rejects.toThrow()
    expect(fetchMock.mock.calls.length).toBeGreaterThan(first)
  })

  // "Try again" is somebody saying they know it failed.
  it('tries anyway when asked outright', async () => {
    const offline = new Error('403')
    const fetchMock = serve({ thatcatdev: offline, 'weeb-vip': offline, bludot: offline })
    await expect(loadRepos({ now: 1_000 })).rejects.toThrow()
    const first = fetchMock.mock.calls.length

    await expect(loadRepos({ force: true, now: 2_000 })).rejects.toThrow()
    expect(fetchMock.mock.calls.length).toBeGreaterThan(first)
  })

  // A stale answer beats a request that is going to be refused.
  it('serves whatever is cached rather than asking again', async () => {
    serve({ thatcatdev: [repo({ name: 'stored' })], 'weeb-vip': [], bludot: [] })
    await loadRepos({ now: 1_000 })

    const offline = new Error('403')
    const fetchMock = serve({ thatcatdev: offline, 'weeb-vip': offline, bludot: offline })
    // Past the TTL, so it tries, fails, and falls back to what it had.
    const stale = await loadRepos({ now: 1_000 + CACHE_TTL_MS + 1 })
    expect(stale.repos[0].name).toBe('stored')

    const after = fetchMock.mock.calls.length
    await loadRepos({ now: 1_000 + CACHE_TTL_MS + 2 })
    expect(fetchMock.mock.calls).toHaveLength(after)
  })
})
