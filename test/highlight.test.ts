import { describe, it, expect } from 'vitest'
import { fromTokens, languageFor } from '../src/utils/highlight'
import { tokens } from '../src/processes/jobs/highlight'

/**
 * The two halves, put back together.
 *
 * Tokenising runs on the jobs thread and building nodes runs on the main one,
 * and jsdom has no worker to send anything to — so the test composes them
 * directly. That it can is the point: both halves are plain functions, and the
 * thread is a delivery mechanism rather than part of the meaning.
 */
const render = (code: string, file: string) => {
  const language = languageFor(file)
  const tree = language ? tokens(language, code) : undefined
  const host = document.createElement('div')
  host.appendChild(fromTokens(tree as never, code))
  return host
}

describe('languageFor', () => {
  it('reads the extension', () => {
    expect(languageFor('index.ts')).toBe('typescript')
    expect(languageFor('main.go')).toBe('go')
    expect(languageFor('style.SCSS')).toBe('css')
    expect(languageFor('deploy.yml')).toBe('yaml')
  })

  // Some files are named, not extended.
  it('recognises files that have no extension', () => {
    expect(languageFor('Dockerfile')).toBe('dockerfile')
    expect(languageFor('Makefile')).toBe('makefile')
    expect(languageFor('.gitignore')).toBe('bash')
  })

  it('gives up on anything it does not know', () => {
    expect(languageFor('bun.lock')).toBeUndefined()
    expect(languageFor('LICENSE')).toBeUndefined()
    expect(languageFor('noextension')).toBeUndefined()
  })
})

describe('highlight', () => {
  it('marks up the parts of a line', () => {
    const host = render('const x = 1 // note', 'a.ts')
    expect(host.querySelector('.tok-keyword')).toBeTruthy()
    expect(host.querySelector('.tok-number')?.textContent).toBe('1')
    expect(host.querySelector('.tok-comment')?.textContent).toContain('note')
  })

  it('keeps the source exactly, character for character', () => {
    const source = 'func main() {\n\tfmt.Println("hi")\n}'
    expect(render(source, 'main.go').textContent).toBe(source)
  })

  /*
   * The file being shown is somebody's repository. Source is built with
   * createTextNode and never reaches innerHTML, so markup inside a file stays
   * text rather than becoming part of the page.
   */
  it('renders markup in a file as text, not as markup', () => {
    const host = render('<script>alert(1)</script>', 'evil.ts')
    expect(host.querySelector('script')).toBeNull()
    expect(host.textContent).toBe('<script>alert(1)</script>')
  })

  it('does the same for a language it highlights as markup', () => {
    const host = render('<img src=x onerror=steal()>', 'page.html')
    expect(host.querySelector('img')).toBeNull()
    expect(host.textContent).toBe('<img src=x onerror=steal()>')
  })

  // Unhighlighted code is a small loss; a broken window is not.
  it('falls back to plain text for an unknown language', () => {
    const host = render('some words', 'notes.unknownext')
    expect(host.textContent).toBe('some words')
    expect(host.querySelector('span')).toBeNull()
  })

  it('copes with an empty file', () => {
    expect(render('', 'a.ts').textContent).toBe('')
  })
})
