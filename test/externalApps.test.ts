import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
    embeds: true,
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
      expect(typeof entry.embeds).toBe('boolean')
    })
  })

  // Whatever keys a menu row or a launcher result has to be unique.
  it('keeps ids unique', () => {
    expect(new Set(APPS.map((a) => a.id)).size).toBe(APPS.length)
  })
})

describe('AppContent', () => {
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
    expect(host.querySelector('.app-notice')).toBeNull()
    await content.unload()
  })

  /*
   * The frame is built either way. Whether an app permits framing is a setting
   * on its own edge that cannot be read from in here — a refused frame and a
   * working one are identical to JavaScript — so the flag is a claim that can
   * go stale, and the notice is laid over a frame that may well be working.
   */
  it('lays a notice over an app expected to refuse the frame', async () => {
    const content = new AppContent(app({ embeds: false }))
    await content.load(host)

    expect(host.querySelector('iframe')).toBeTruthy()
    expect(host.querySelector('.app-notice')?.textContent).toContain('thing.example')
    await content.unload()
  })

  it('takes the notice away when dismissed, leaving the frame', async () => {
    const content = new AppContent(app({ embeds: false }))
    await content.load(host)

    host.querySelector<HTMLButtonElement>('.app-notice-close')!.click()

    expect(host.querySelector('.app-notice')).toBeNull()
    expect(host.querySelector('iframe')).toBeTruthy()
    await content.unload()
  })

  // A page still loading into a window that has gone would carry on fetching.
  it('stops the frame loading when the window closes', async () => {
    const content = new AppContent(app())
    await content.load(host)
    const frame = host.querySelector('iframe')!

    await content.unload()
    expect(frame.getAttribute('src')).toBe('about:blank')
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
