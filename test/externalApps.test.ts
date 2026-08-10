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

  /*
   * The frame is transparent until the app paints into it, so the window covers
   * it — see the splash tests for the cover itself. All this content owes it is
   * a promise that settles when the frame stops being pending.
   */
  it('is ready once the frame answers', async () => {
    const content = new AppContent(app())
    await content.load(host)

    let ready = false
    void content.ready.then(() => {
      ready = true
    })
    await Promise.resolve()
    expect(ready).toBe(false)

    host.querySelector('iframe')!.dispatchEvent(new Event('load'))
    await content.ready
    expect(ready).toBe(true)

    await content.unload()
  })

  /*
   * `load` fires for a page that arrived and for one the browser replaced with
   * an error page, and frames rarely fire `error` at all — so the cover comes
   * off for either. It is in the way of whatever is underneath, and once
   * anything is underneath it should go.
   */
  it('is ready when the frame errors, rather than waiting forever', async () => {
    const content = new AppContent(app())
    await content.load(host)

    host.querySelector('iframe')!.dispatchEvent(new Event('error'))
    await expect(content.ready).resolves.toBeUndefined()

    await content.unload()
  })

  // What the default cover cannot know: which host is being waited on, what the
  // app looks like, and what its silence would mean.
  it('overrides the cover with the app it is waiting for', async () => {
    const content = new AppContent(app())
    const splash = content.splash as Exclude<typeof content.splash, false>

    expect(splash.label).toContain('thing.example')
    expect(splash.icon).toBe('/apps/thing.svg')
    expect(splash.patience).toBe(10_000)

    const notice = splash.notice!()
    expect(notice.title).toContain('Thing')
    expect(notice.actions?.[0].href).toBe('https://thing.example')
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
