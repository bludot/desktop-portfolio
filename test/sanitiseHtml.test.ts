import { describe, it, expect } from 'vitest'
import sanitiseHtml from '../src/utils/sanitiseHtml'

/**
 * This is the one place third-party markup reaches innerHTML, so it is tested
 * as a security boundary rather than as a formatter: the question in each case
 * is what an attacker gets, not what the output looks like.
 */
describe('sanitiseHtml', () => {
  const clean = (html: string, options = {}) => sanitiseHtml(html, options)

  describe('what it removes', () => {
    it('drops scripts along with their contents', () => {
      const out = clean('<p>before</p><script>alert(1)</script><p>after</p>')
      expect(out).not.toContain('script')
      expect(out).not.toContain('alert')
      expect(out).toContain('before')
      expect(out).toContain('after')
    })

    it.each([
      'iframe', 'object', 'embed', 'form', 'input', 'style', 'link', 'meta',
      'svg', 'template', 'noscript', 'canvas',
    ])('drops <%s>', (tag) => {
      expect(clean(`<${tag}>x</${tag}>`)).not.toContain(`<${tag}`)
    })

    // One rule covers onclick, onerror, onload and everything like them.
    it('strips every event handler', () => {
      const out = clean('<p onclick="steal()" ONERROR="x" onmouseover="y">hi</p>')
      expect(out).not.toContain('onclick')
      expect(out).not.toContain('ONERROR')
      expect(out).not.toContain('onmouseover')
      expect(out).toContain('hi')
    })

    it('strips attributes it was not asked for', () => {
      const out = clean('<p class="markdown-body" id="readme" data-x="1">hi</p>')
      // GitHub's own classes would collide with the desktop's stylesheet.
      expect(out).not.toContain('class')
      expect(out).not.toContain('id=')
      expect(out).not.toContain('data-x')
    })

    it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'vbscript:x', 'data:text/html,<b>'])(
      'refuses %s as a link',
      (href) => {
        expect(clean(`<a href="${href}">x</a>`)).not.toContain('href')
      },
    )

    it('refuses a data URL that is not an image, even on an image', () => {
      expect(clean('<img src="data:text/html,<script>">')).not.toContain('src')
    })

    /*
     * An unknown tag is unwrapped rather than dropped: the markup may be
     * something harmless we simply did not list, and its words should survive.
     */
    it('unwraps a tag it does not know, keeping the words', () => {
      const out = clean('<marquee>still readable</marquee>')
      expect(out).not.toContain('marquee')
      expect(out).toContain('still readable')
    })

    it('reaches nested danger, not just the top level', () => {
      const out = clean('<div><p><span onclick="x"><script>bad()</script>ok</span></p></div>')
      expect(out).not.toContain('onclick')
      expect(out).not.toContain('bad()')
      expect(out).toContain('ok')
    })
  })

  describe('what it keeps', () => {
    it('keeps the markup a README is made of', () => {
      const out = clean(
        '<h1>Title</h1><p><strong>bold</strong> <em>it</em> <code>x</code></p>' +
          '<ul><li>one</li></ul><pre><code>block</code></pre>' +
          '<table><tr><th>h</th><td>d</td></tr></table>',
      )
      ;['<h1>', '<strong>', '<em>', '<code>', '<ul>', '<li>', '<pre>', '<table>', '<th>', '<td>']
        .forEach((tag) => expect(out).toContain(tag))
    })

    it('keeps an image with its dimensions and alt text', () => {
      const out = clean('<img src="https://x.test/a.png" alt="a" width="200" height="100">')
      expect(out).toContain('alt="a"')
      expect(out).toContain('width="200"')
      expect(out).toContain('height="100"')
    })

    it('allows an inline image', () => {
      const src = 'data:image/png;base64,AAAA'
      expect(clean(`<img src="${src}">`)).toContain(src)
    })
  })

  describe('links out', () => {
    it('sends every link to a new tab, with no handle back', () => {
      const out = clean('<a href="https://x.test">x</a>')
      expect(out).toContain('target="_blank"')
      expect(out).toContain('rel="noopener noreferrer"')
    })

    it('leaves an anchor without a destination alone', () => {
      expect(clean('<a>no href</a>')).not.toContain('target')
    })
  })

  describe('relative URLs', () => {
    const bases = {
      imageBase: 'https://raw.githubusercontent.com/o/r/HEAD',
      linkBase: 'https://github.com/o/r/blob/HEAD',
    }

    it('resolves images against the raw file root', () => {
      expect(clean('<img src="resources/logo.png">', bases)).toContain(
        'https://raw.githubusercontent.com/o/r/HEAD/resources/logo.png',
      )
    })

    it('resolves links against the file browser', () => {
      expect(clean('<a href="./docs/x.md">d</a>', bases)).toContain(
        'https://github.com/o/r/blob/HEAD/docs/x.md',
      )
    })

    it('leaves absolute URLs and anchors where they are', () => {
      expect(clean('<img src="https://img.shields.io/b.svg">', bases)).toContain(
        'https://img.shields.io/b.svg',
      )
      expect(clean('<a href="#install">i</a>', bases)).toContain('href="#install"')
      expect(clean('<img src="//cdn.test/a.png">', bases)).toContain('//cdn.test/a.png')
    })

    it('leaves relative URLs alone when there is nothing to resolve against', () => {
      expect(clean('<img src="a.png">')).toContain('src="a.png"')
    })
  })

  it('survives markup that is empty or broken', () => {
    expect(clean('')).toBe('')
    expect(() => clean('<p>unclosed <div><span>')).not.toThrow()
  })
})
