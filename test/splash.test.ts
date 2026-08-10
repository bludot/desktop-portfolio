import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import Splash, { defaultSplash, resolveSplash } from '../src/components/Splash'
import OSWindow from '../src/components/Window'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  host.remove()
})

describe('what a window is covered with', () => {
  // The title is the one thing every window has, and the word the person
  // waiting has already read on the titlebar.
  it('falls back to the window title when the content asks for nothing', () => {
    const spec = resolveSplash({ ready: Promise.resolve() }, 'Projects')!
    expect(spec.label).toBe('Opening Projects…')
    expect(spec.initial).toBe('Projects')
  })

  it('takes only the parts the content disagrees with', () => {
    const spec = resolveSplash(
      { ready: Promise.resolve(), splash: { label: 'Reading GitHub…' } },
      'Projects'
    )!
    expect(spec.label).toBe('Reading GitHub…')
    // Untouched, so an override never has to restate the default.
    expect(spec.initial).toBe(defaultSplash('Projects').initial)
  })

  it('shows nothing at all when the content opts out', () => {
    expect(resolveSplash({ ready: Promise.resolve(), splash: false }, 'About')).toBeUndefined()
  })

  /*
   * A cover with nothing to end it would sit over the window for good, so
   * content that never says when it is ready is never covered — which is right
   * for a page of prose that is finished the moment it is mounted.
   */
  it('shows nothing for content that never says when it is ready', () => {
    expect(resolveSplash({ splash: { label: 'Hold on…' } }, 'About')).toBeUndefined()
    expect(resolveSplash(undefined, 'About')).toBeUndefined()
  })
})

describe('Splash', () => {
  it('names what is coming, beside something to look at', async () => {
    const splash = new Splash({ label: 'Reading GitHub…', initial: 'Projects' })
    await splash.load(host)

    expect(host.querySelector('.splash-label')?.textContent).toBe('Reading GitHub…')
    expect(host.querySelector('.splash-spinner')).toBeTruthy()
    // The initial stands in for a mark, and is a mark rather than an apology.
    expect(host.querySelector('.splash-initial')?.textContent).toBe('P')
  })

  it('draws a mark the content brought with it', async () => {
    const mark = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const splash = new Splash({ label: 'Reading GitHub…', icon: mark })
    await splash.load(host)

    expect(host.querySelector('.splash-mark svg')).toBe(mark)
  })

  // A favicon is somebody else's file, and a broken-image glyph reads as the
  // desktop being broken rather than the icon.
  it('falls back to the initial when an icon will not load', async () => {
    const splash = new Splash({ label: 'Loading…', icon: '/apps/x.svg', initial: 'Thing' })
    await splash.load(host)

    host.querySelector('img')!.dispatchEvent(new Event('error'))

    expect(host.querySelector('img')).toBeNull()
    expect(host.querySelector('.splash-initial')?.textContent).toBe('T')
  })

  it('leaves when the wait is over', async () => {
    const splash = new Splash({ label: 'Loading…' })
    await splash.load(host)
    expect(host.querySelector('.splash')).toBeTruthy()

    await splash.reveal()
    expect(host.querySelector('.splash')).toBeNull()
  })

  describe('a wait that goes on too long', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const spec = () => ({
      label: 'Loading thing.example…',
      patience: 10_000,
      notice: () => ({
        title: 'Thing may not open in a window',
        body: ['nothing is broken here, and the app is running at ', { code: 'thing.example' }],
        actions: [
          { label: 'Go to thing.example ↗', href: 'https://thing.example' },
          { label: 'Keep waiting', dismisses: true }
        ],
        dismissible: true
      })
    })

    it('stops promising and starts explaining', async () => {
      const splash = new Splash(spec())
      await splash.load(host)

      expect(host.querySelector('.splash-notice-title')).toBeNull()
      vi.advanceTimersByTime(10_000)

      expect(host.querySelector('.splash-notice-title')?.textContent).toContain('Thing')
      expect(host.querySelector('.splash-notice-body code')?.textContent).toBe('thing.example')
      // The spinner has gone; the cover is a paragraph now, not a promise.
      expect(host.querySelector('.splash-spinner')).toBeNull()
      expect(host.querySelector('.splash')).toBeTruthy()
    })

    it('offers somewhere else to go, in its own tab', async () => {
      const splash = new Splash(spec())
      await splash.load(host)
      vi.advanceTimersByTime(10_000)

      const link = host.querySelector<HTMLAnchorElement>('.splash-actions a')!
      expect(link.href).toBe('https://thing.example/')
      expect(link.target).toBe('_blank')
      expect(link.rel).toBe('noopener noreferrer')
    })

    it('gets out of the way when pressed past', async () => {
      const splash = new Splash(spec())
      await splash.load(host)
      vi.advanceTimersByTime(10_000)

      host.querySelector<HTMLButtonElement>('.splash-actions button')!.click()
      await vi.waitFor(() => expect(host.querySelector('.splash')).toBeNull())
    })

    it('gets out of the way when dismissed from the corner', async () => {
      const splash = new Splash(spec())
      await splash.load(host)
      vi.advanceTimersByTime(10_000)

      host.querySelector<HTMLButtonElement>('.splash-close')!.click()
      await vi.waitFor(() => expect(host.querySelector('.splash')).toBeNull())
    })

    /*
     * Leaving it up would hide a working window behind a paragraph about how it
     * might not work.
     */
    it('drops the explanation if the wait ends after it went up', async () => {
      const splash = new Splash(spec())
      await splash.load(host)
      vi.advanceTimersByTime(10_000)
      expect(host.querySelector('.splash-notice-title')).toBeTruthy()

      await splash.reveal()
      expect(host.querySelector('.splash')).toBeNull()
    })

    // Nothing here can say what a wait it knows nothing about means, and a
    // notice that guesses is worse than a spinner that admits it is waiting.
    it('keeps waiting when there is nothing honest to say', async () => {
      const splash = new Splash({ label: 'Loading…', patience: 10_000 })
      await splash.load(host)
      vi.advanceTimersByTime(10_000)

      expect(host.querySelector('.splash-spinner')).toBeTruthy()
    })

    // A window that has gone should not still be counting down to a notice.
    it('stops counting down when it is taken away', async () => {
      const splash = new Splash(spec())
      await splash.load(host)

      await splash.dismiss()

      expect(vi.getTimerCount()).toBe(0)
      expect(host.querySelector('.splash')).toBeNull()
    })
  })
})

describe('a window over its content', () => {
  const makeDesktop = () => {
    const root = document.createElement('div')
    const taskbar = document.createElement('div')
    document.body.appendChild(root)
    return {
      getElement: () => root,
      getTaskbar: () => ({ getElement: () => taskbar })
    } as any
  }

  const makeWindow = (content: unknown, title = 'Projects') =>
    new OSWindow({
      title,
      content,
      desktop: makeDesktop(),
      onActive: vi.fn(),
      onClose: vi.fn(),
      center: false,
      dimensions: { width: 400, height: 300 },
      windowPosition: { top: 30, left: 30 }
    } as any)

  /** Content that mounts at once but has something still on its way. */
  const waiting = (over: Record<string, unknown> = {}) => {
    let arrived!: () => void
    const ready = new Promise<void>((resolve) => {
      arrived = resolve
    })
    return {
      ready,
      arrive: () => arrived(),
      load: vi.fn().mockResolvedValue(undefined),
      ...over
    }
  }

  it('covers the content until it says it is ready', async () => {
    const content = waiting()
    const win = makeWindow(content)
    await win.load(null as unknown as HTMLElement)

    expect(win.getElement().querySelector('.splash-label')?.textContent).toBe('Opening Projects…')

    content.arrive()
    await vi.waitFor(() =>
      expect(win.getElement().querySelector('.splash')).toBeNull()
    )
  })

  // The cover goes over the content, never over the titlebar: a window whose
  // content never arrives must still be closable.
  it('leaves the window controls reachable while it waits', async () => {
    const win = makeWindow(waiting())
    await win.load(null as unknown as HTMLElement)

    const splash = win.getElement().querySelector('.splash')!
    expect(splash.closest('.topbar-window')).toBeNull()
    expect(win.getElement().querySelector('.topbar-window')).toBeTruthy()
  })

  it('covers nothing for content that is ready as soon as it is mounted', async () => {
    const win = makeWindow(document.createElement('p'), 'About')
    await win.load(null as unknown as HTMLElement)

    expect(win.getElement().querySelector('.splash')).toBeNull()
  })

  it('lets content refuse a cover outright', async () => {
    const win = makeWindow(waiting({ splash: false }))
    await win.load(null as unknown as HTMLElement)

    expect(win.getElement().querySelector('.splash')).toBeNull()
  })

  it('lets content say what the cover should read', async () => {
    const win = makeWindow(waiting({ splash: { label: 'Reading GitHub…' } }))
    await win.load(null as unknown as HTMLElement)

    expect(win.getElement().querySelector('.splash-label')?.textContent).toBe('Reading GitHub…')
  })

  // A window closing on content that never arrived would otherwise leave the
  // content fetching and the cover still counting down.
  it('takes the content and its cover down with it', async () => {
    const unload = vi.fn().mockResolvedValue(undefined)
    const content = waiting({ unload })
    const win = makeWindow(content)
    await win.load(null as unknown as HTMLElement)
    expect(win.getElement().querySelector('.splash')).toBeTruthy()

    await win.unload()

    expect(unload).toHaveBeenCalled()
    expect(win.getElement().querySelector('.splash')).toBeNull()
  })
})
