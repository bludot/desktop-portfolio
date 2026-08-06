import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import ProjectsContent from '../src/contents/projects'
import {
  classify,
  countInside,
  listDirectory,
  rawUrl,
  type TreeEntry,
} from '../src/utils/github'
import {
  ageLabel,
  brief,
  byteSize,
  crumbs,
  dropRepeatedTitle,
  numberLines,
  parentOf,
  railLine,
} from '../src/contents/projects/view'
import db from '../src/Store'

jss.setup(preset())
jss.use(nested())

const entry = (path: string, type: 'blob' | 'tree' = 'blob', size = 100): TreeEntry => ({
  path,
  name: path.slice(path.lastIndexOf('/') + 1),
  type,
  size,
})

const TREE: TreeEntry[] = [
  entry('README.md'),
  entry('package.json'),
  entry('src', 'tree', 0),
  entry('src/index.ts'),
  entry('src/utils', 'tree', 0),
  entry('src/utils/github.ts', 'blob', 4800),
  entry('src/utils/motion.ts', 'blob', 5200),
  entry('src/components', 'tree', 0),
  entry('src/components/Window', 'tree', 0),
  entry('src/components/Window/index.ts'),
]

describe('listDirectory', () => {
  it('returns only what sits directly inside, not the whole subtree', () => {
    expect(listDirectory(TREE, '').map((e) => e.name)).toEqual([
      'src',
      'package.json',
      'README.md',
    ])
  })

  it('descends one level at a time', () => {
    expect(listDirectory(TREE, 'src').map((e) => e.name)).toEqual([
      'components',
      'utils',
      'index.ts',
    ])
    expect(listDirectory(TREE, 'src/utils').map((e) => e.name)).toEqual([
      'github.ts',
      'motion.ts',
    ])
  })

  // The order every file browser uses, so it needs no explanation.
  it('puts directories first, then files, each alphabetically', () => {
    expect(listDirectory(TREE, 'src').map((e) => e.name)).toEqual([
      'components',
      'utils',
      'index.ts',
    ])
    // Case is ignored, as in every file browser.
    expect(listDirectory(TREE, '').map((e) => e.name)).toEqual([
      'src',
      'package.json',
      'README.md',
    ])
  })

  it('says nothing for a path that is not there', () => {
    expect(listDirectory(TREE, 'nope')).toEqual([])
  })

  /*
   * The prefix has to match a whole segment: "src" must not swallow "srcfoo",
   * which a plain startsWith would.
   */
  it('does not treat a similarly named sibling as a child', () => {
    const tree = [entry('src', 'tree', 0), entry('srcfoo/a.ts'), entry('src/b.ts')]
    expect(listDirectory(tree, 'src').map((e) => e.name)).toEqual(['b.ts'])
  })
})

describe('countInside', () => {
  it('counts files at any depth, not directories', () => {
    expect(countInside(TREE, 'src')).toBe(4)
    expect(countInside(TREE, 'src/utils')).toBe(2)
    expect(countInside(TREE, 'src/components')).toBe(1)
  })
})

describe('classify', () => {
  it('recognises what it can render', () => {
    expect(classify(entry('logo.png'))).toBe('image')
    expect(classify(entry('icon.SVG'))).toBe('image')
    expect(classify(entry('index.ts'))).toBe('text')
  })

  it('refuses what it cannot', () => {
    expect(classify(entry('app.wasm'))).toBe('binary')
    expect(classify(entry('font.woff2'))).toBe('binary')
  })

  // Machine-written and enormous: opening one tells you nothing.
  it('refuses lockfiles by name, whatever their size', () => {
    expect(classify(entry('bun.lock', 'blob', 10))).toBe('generated')
    expect(classify(entry('package-lock.json'))).toBe('generated')
    expect(classify(entry('go.sum'))).toBe('generated')
  })

  it('refuses text that is too long to be worth opening', () => {
    expect(classify(entry('huge.ts', 'blob', 500_000))).toBe('too-large')
    expect(classify(entry('fine.ts', 'blob', 199_000))).toBe('text')
  })
})

describe('paths', () => {
  it('breaks a directory into its segments', () => {
    expect(crumbs('src/utils')).toEqual(['src', 'utils'])
    expect(crumbs('')).toEqual([])
  })

  it('climbs one level, and stops at the root', () => {
    expect(parentOf('src/utils')).toBe('src')
    expect(parentOf('src')).toBe('')
    expect(parentOf('')).toBe('')
  })

  it('builds a raw URL against the default branch', () => {
    expect(rawUrl('bludot', 'desktop-portfolio', 'src/index.ts')).toBe(
      'https://raw.githubusercontent.com/bludot/desktop-portfolio/HEAD/src/index.ts',
    )
  })
})

describe('numberLines', () => {
  it('numbers from one, and keeps the source beside it', () => {
    const { numbers, source } = numberLines('a\nb\nc')
    expect(numbers).toBe('1\n2\n3')
    expect(source).toBe('a\nb\nc')
  })

  // A file ending in a newline should not gain a phantom last line.
  it('ignores a trailing newline', () => {
    expect(numberLines('a\nb\n').numbers).toBe('1\n2')
  })

  it('copes with an empty file', () => {
    expect(numberLines('').numbers).toBe('1')
  })
})

describe('sizes', () => {
  it('says bytes the way a person would', () => {
    expect(byteSize(400)).toBe('400 B')
    expect(byteSize(4800)).toBe('5 KB')
    expect(byteSize(2_400_000)).toBe('2.4 MB')
  })
})

describe('ageLabel', () => {
  const now = new Date(2026, 6, 15)

  it('reaches for the roughest useful unit', () => {
    expect(ageLabel('2026-02-21T00:00:00Z', now)).toBe('5 months')
    expect(ageLabel('2026-06-30T00:00:00Z', now)).toBe('1 month')
    expect(ageLabel('2012-08-20T00:00:00Z', now)).toBe('13 years')
  })

  it('says nothing rather than something wrong', () => {
    expect(ageLabel('', now)).toBe('')
    expect(ageLabel('not a date', now)).toBe('')
    expect(ageLabel('2026-07-10T00:00:00Z', now)).toBe('this month')
  })
})

describe('brief', () => {
  const repo = {
    id: 1,
    name: 'tanrenai',
    owner: 'thatcatdev',
    description: '',
    language: 'Go',
    stars: 1,
    url: '',
    homepage: '',
    pushedAt: '2026-07-09T00:00:00Z',
    createdAt: '2026-02-21T00:00:00Z',
    size: 43494,
    archived: false,
  }
  const now = new Date(2026, 6, 15)

  /*
   * Every figure comes from a field each repository has. A topics-and-licence
   * panel would be empty for almost all of them.
   */
  it('is built only from fields that are always present', () => {
    const cells = brief(repo, [['Go', 800], ['TypeScript', 200]], now)
    expect(cells.map((c) => c.value)).toEqual(['Go', '5 months', '2026/07', '42 MB'])
    expect(cells[0].label).toBe('80% of source')
  })

  it('falls back to the repository language when there is no split', () => {
    expect(brief(repo, [], now)[0]).toEqual({ value: 'Go', label: 'language' })
  })

  it('leaves out what is missing rather than printing a blank', () => {
    const bare = { ...repo, language: '', pushedAt: '', createdAt: '', size: 0 }
    expect(brief(bare, [], now)).toEqual([])
  })
})

describe('railLine', () => {
  it('reads as a count over a span', () => {
    expect(
      railLine({ count: 20, stars: 1, languages: [], firstYear: '2021', lastYear: '2026' }),
    ).toBe('20 · 2021–2026')
  })

  it('does not print a span of one year twice', () => {
    expect(
      railLine({ count: 3, stars: 0, languages: [], firstYear: '2026', lastYear: '2026' }),
    ).toBe('3 · 2026')
  })
})

describe('dropRepeatedTitle', () => {
  /*
   * Every one of these READMEs opens with its own H1 directly under the title
   * the window already shows, which reads as a stutter.
   */
  it('removes an opening heading that repeats the repository name', () => {
    const out = dropRepeatedTitle('<h1>tanrenai</h1><p>body</p>', 'tanrenai')
    expect(out).not.toContain('<h1>')
    expect(out).toContain('body')
  })

  it('matches through punctuation and trailing words', () => {
    expect(dropRepeatedTitle('<h1>Tanrenai (鍛錬AI)</h1><p>x</p>', 'tanrenai')).not.toContain(
      '<h1>',
    )
  })

  it('keeps a heading that is actually different', () => {
    expect(dropRepeatedTitle('<h1>Getting started</h1><p>x</p>', 'tanrenai')).toContain('<h1>')
  })

  it('keeps a heading that is not the opener', () => {
    const html = '<p>intro</p><h1>tanrenai</h1>'
    expect(dropRepeatedTitle(html, 'tanrenai')).toContain('<h1>')
  })

  /*
   * Regression: GitHub wraps every README in a div and an article, so the
   * heading is never a child of the body. Walking siblings decided the title
   * was buried and kept every one of them.
   */
  it('finds the title through the wrappers GitHub adds', () => {
    const html = '<div id="readme"><div><h1>tanrenai</h1><p>body</p></div></div>'
    const out = dropRepeatedTitle(html, 'tanrenai')
    expect(out).not.toContain('<h1>')
    expect(out).toContain('body')
  })

  it('leaves a README with no heading alone', () => {
    expect(dropRepeatedTitle('<p>just words</p>', 'x')).toBe('<p>just words</p>')
  })
})

// --------------------------------------------------------------- the window

describe('Files tab', () => {
  let host: HTMLElement
  let content: ProjectsContent

  const repoJson = (over: Record<string, unknown> = {}) => ({
    id: 1,
    name: 'desktop-portfolio',
    owner: { login: 'bludot' },
    description: 'Portfolio like an OS',
    language: 'TypeScript',
    stargazers_count: 0,
    html_url: 'https://github.com/bludot/desktop-portfolio',
    pushed_at: '2026-08-05T00:00:00Z',
    created_at: '2021-01-01T00:00:00Z',
    size: 1024,
    fork: false,
    archived: false,
    ...over,
  })

  const serve = (options: { tree?: unknown; file?: string; treeFails?: boolean } = {}) => {
    ;(globalThis as any).fetch = vi.fn(async (url: string) => {
      if (url.includes('/git/trees/')) {
        if (options.treeFails) return { ok: false, status: 500, json: async () => ({}) }
        return {
          ok: true,
          status: 200,
          json: async () =>
            options.tree ?? {
              truncated: false,
              tree: [
                { path: 'README.md', type: 'blob', size: 3895 },
                { path: 'bun.lock', type: 'blob', size: 480_000 },
                { path: 'logo.png', type: 'blob', size: 34_000 },
                { path: 'src', type: 'tree' },
                { path: 'src/index.ts', type: 'blob', size: 220 },
              ],
            },
        }
      }
      if (url.includes('raw.githubusercontent.com')) {
        return { ok: true, status: 200, text: async () => options.file ?? 'line one\nline two' }
      }
      if (url.includes('/readme')) return { ok: true, status: 200, text: async () => '<p>hi</p>' }
      if (url.includes('/languages')) return { ok: true, status: 200, json: async () => ({}) }
      if (url.includes('/users/bludot/')) {
        return { ok: true, status: 200, json: async () => [repoJson()] }
      }
      return { ok: true, status: 200, json: async () => [] }
    })
  }

  const openFiles = async () => {
    content = new ProjectsContent()
    await content.load(host)
    await vi.waitFor(() => expect(host.querySelector('.project')).toBeTruthy())
    ;(host.querySelector('.project') as HTMLElement).click()
    await vi.waitFor(() => expect(host.querySelector('.detail-tabs')).toBeTruthy())
    ;([...host.querySelectorAll('.detail-tabs button')].find(
      (b) => b.textContent === 'Files',
    ) as HTMLElement).click()
    await vi.waitFor(() => expect(host.querySelector('.file-row')).toBeTruthy())
  }

  const rowNamed = (name: string) =>
    [...host.querySelectorAll('.file-row')].find(
      (r) => r.querySelector('.file-name')?.textContent === name,
    ) as HTMLElement

  beforeEach(async () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    await db.cache.clear()
  })

  afterEach(async () => {
    await content?.unload()
    host.remove()
    delete (globalThis as any).fetch
    vi.restoreAllMocks()
  })

  it('lists the root, directories first', async () => {
    serve()
    await openFiles()

    // Case-insensitive, the way every file browser sorts: bun.lock before
    // README.md, not after it because of a capital R.
    expect([...host.querySelectorAll('.file-name')].map((n) => n.textContent)).toEqual([
      'src',
      'bun.lock',
      'logo.png',
      'README.md',
    ])
  })

  it('walks into a directory and back out again', async () => {
    serve()
    await openFiles()

    rowNamed('src').click()
    expect([...host.querySelectorAll('.file-name')].map((n) => n.textContent)).toEqual([
      '..',
      'index.ts',
    ])

    // The breadcrumb climbs back.
    ;([...host.querySelectorAll('.crumb')].find(
      (c) => c.textContent === 'desktop-portfolio',
    ) as HTMLElement).click()
    expect(host.querySelectorAll('.file-name')[0].textContent).toBe('src')
  })

  it('opens a text file with line numbers', async () => {
    serve({ file: 'const a = 1\nconst b = 2\nexport { a, b }' })
    await openFiles()

    rowNamed('src').click()
    rowNamed('index.ts').click()

    await vi.waitFor(() => expect(host.querySelector('.file-code')).toBeTruthy())
    expect(host.querySelector('.file-numbers')?.textContent).toBe('1\n2\n3')
    expect(host.querySelector('.file-source')?.textContent).toContain('export { a, b }')
  })

  /*
   * Text is fetched; everything else is decided from the name and the size, so
   * a 480KB lockfile is never pulled down at all.
   */
  it('refuses a lockfile without fetching it', async () => {
    serve()
    await openFiles()
    const before = (globalThis as any).fetch.mock.calls.length

    rowNamed('bun.lock').click()

    expect(host.querySelector('.projects-note')?.textContent).toContain('written by a tool')
    expect((globalThis as any).fetch.mock.calls.length).toBe(before)
  })

  it('renders an image from raw rather than reading it as text', async () => {
    serve()
    await openFiles()

    rowNamed('logo.png').click()

    const image = host.querySelector<HTMLImageElement>('.file-image')
    expect(image).toBeTruthy()
    expect(image!.getAttribute('src')).toBe(
      'https://raw.githubusercontent.com/bludot/desktop-portfolio/HEAD/logo.png',
    )
  })

  it('offers the raw file for anything it will not render', async () => {
    serve()
    await openFiles()
    rowNamed('bun.lock').click()

    const raw = host.querySelector<HTMLAnchorElement>('.file-head a')!
    expect(raw.href).toContain('raw.githubusercontent.com')
    expect(raw.rel).toBe('noopener noreferrer')
  })

  it('says when the file list could not be read', async () => {
    serve({ treeFails: true })
    content = new ProjectsContent()
    await content.load(host)
    await vi.waitFor(() => expect(host.querySelector('.project')).toBeTruthy())
    ;(host.querySelector('.project') as HTMLElement).click()
    await vi.waitFor(() => expect(host.querySelector('.detail-tabs')).toBeTruthy())
    ;([...host.querySelectorAll('.detail-tabs button')].find(
      (b) => b.textContent === 'Files',
    ) as HTMLElement).click()

    await vi.waitFor(() =>
      expect(host.querySelector('.projects-note')?.textContent).toContain(
        'file list could not be read',
      ),
    )
  })

  it('goes back to the README without refetching the tree', async () => {
    serve()
    await openFiles()
    const treeCalls = () =>
      (globalThis as any).fetch.mock.calls.filter((c: string[]) =>
        c[0].includes('/git/trees/'),
      ).length
    const before = treeCalls()

    ;([...host.querySelectorAll('.detail-tabs button')].find(
      (b) => b.textContent === 'Readme',
    ) as HTMLElement).click()
    expect(host.querySelector('.detail-readme')).toBeTruthy()

    ;([...host.querySelectorAll('.detail-tabs button')].find(
      (b) => b.textContent === 'Files',
    ) as HTMLElement).click()

    expect(host.querySelector('.file-row')).toBeTruthy()
    expect(treeCalls()).toBe(before)
  })
})
