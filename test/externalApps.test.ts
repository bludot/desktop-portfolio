import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import AppContent from '../src/contents/app'
import appIcon from '../src/components/AppIcon'
import { APPS } from '../src/apps/external'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

const app = (over: Record<string, unknown> = {}) =>
  ({
    id: 'thing',
    name: 'Thing',
    host: 'thing.example',
    url: 'https://thing.example',
    blurb: 'does a thing',
    icon: '/apps/thing.svg',
    ...over,
  }) as any

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  host.remove()
})

describe('the external apps list', () => {
  it('gives every app what both surfaces need to draw it', () => {
    expect(APPS.length).toBeGreaterThan(0)
    APPS.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\//)
      expect(entry.host).toBeTruthy()
      expect(entry.icon).toMatch(/^\/apps\//)
    })
  })

  // Whatever keys a menu row or a launcher result has to be unique.
  it('keeps ids unique', () => {
    expect(new Set(APPS.map((a) => a.id)).size).toBe(APPS.length)
  })
})

describe('AppContent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** The cover leaves on a microtask, after the fade nothing renders resolves. */
  const settle = () => vi.waitFor(() => expect(host.querySelector('.app-cover')).toBeNull())

  it('frames the app', async () => {
    const content = new AppContent(app())
    await content.load(host)

    const frame = host.querySelector('iframe')!
    expect(frame.getAttribute('src')).toBe('https://thing.example')
    expect(frame.title).toBe('Thing')
    /*
     * Not sandboxed. These are the author's own applications, and `sandbox`
     * without `allow-same-origin` would cut each off from its own cookies —
     * which is to say from being logged in, which is most of what they do.
     */
    expect(frame.hasAttribute('sandbox')).toBe(false)
    await content.unload()
  })

  // The frame is transparent until the app paints into it, so without a cover
  // the window opens onto its own empty chrome and says nothing.
  it('covers the frame until it loads, naming what is coming', async () => {
    const content = new AppContent(app())
    await content.load(host)

    expect(host.querySelector('.app-cover')?.textContent).toContain('thing.example')
    expect(host.querySelector('.app-spinner')).toBeTruthy()

    host.querySelector('iframe')!.dispatchEvent(new Event('load'))
    await settle()

    expect(host.querySelector('iframe')).toBeTruthy()
    await content.unload()
  })

  /*
   * The one failure that can be seen from in here: a frame that never answers.
   * A frame that is *refused* fires `load` almost at once — the browser's error
   * page loads — so it is indistinguishable from a fast app and no timer
   * catches it. This covers the silence, which is all it claims to.
   */
  it('explains itself when the frame stays silent', async () => {
    const content = new AppContent(app())
    await content.load(host)

    expect(host.querySelector('.app-notice')).toBeNull()
    vi.advanceTimersByTime(10_000)

    expect(host.querySelector('.app-notice')?.textContent).toContain('thing.example')
    expect(host.querySelector('.app-cover')).toBeNull()
    // The frame is left alone underneath; it may still be on its way.
    expect(host.querySelector('iframe')).toBeTruthy()
    await content.unload()
  })

  it('takes the notice away when dismissed, leaving the frame', async () => {
    const content = new AppContent(app())
    await content.load(host)
    vi.advanceTimersByTime(10_000)

    host.querySelector<HTMLButtonElement>('.app-notice-close')!.click()

    expect(host.querySelector('.app-notice')).toBeNull()
    expect(host.querySelector('iframe')).toBeTruthy()
    await content.unload()
  })

  // Leaving it up would hide a working app behind a paragraph about how it
  // might not work.
  it('drops the notice if the frame answers after the wait ran out', async () => {
    const content = new AppContent(app())
    await content.load(host)
    vi.advanceTimersByTime(10_000)
    expect(host.querySelector('.app-notice')).toBeTruthy()

    host.querySelector('iframe')!.dispatchEvent(new Event('load'))
    await vi.waitFor(() => expect(host.querySelector('.app-notice')).toBeNull())

    await content.unload()
  })

  // A page still loading into a window that has gone would carry on fetching,
  // and a window that has gone should not still be counting down to a notice.
  it('stops the frame loading when the window closes', async () => {
    const content = new AppContent(app())
    await content.load(host)
    const frame = host.querySelector('iframe')!

    await content.unload()

    expect(frame.getAttribute('src')).toBe('about:blank')
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('appIcon', () => {
  it('draws the app favicon, aligned with the menu it sits in', () => {
    const icon = appIcon(APPS[0])
    const img = icon.querySelector('img')!
    expect(img.getAttribute('src')).toBe(APPS[0].icon)
    // Decorative — the label beside it already names the app.
    expect(img.getAttribute('alt')).toBe('')
    // The same gutter every other icon in the start menu sets on itself.
    // Read back normalised, so assert the parts rather than the shorthand.
    expect(icon.style.marginTop).toBe('0px')
    expect(icon.style.marginLeft).toBe('10px')
    expect(icon.style.marginRight).toBe('10px')
  })

  // A favicon is somebody else's file, and a broken-image glyph in a menu reads
  // as the desktop being broken rather than the icon.
  it('falls back to an initial when the favicon will not load', () => {
    const icon = appIcon(APPS[0])
    icon.querySelector('img')!.dispatchEvent(new Event('error'))

    expect(icon.querySelector('img')).toBeNull()
    expect(icon.textContent).toBe(APPS[0].name.slice(0, 1))
  })
})
