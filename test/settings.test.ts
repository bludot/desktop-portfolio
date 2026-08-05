import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import { SettingsContent } from '../src/apps/Settings'
import appearance, { DEFAULT_APPEARANCE } from '../src/utils/appearance'
import { accentPalette, cornerStyles } from '../src/theme'
import db, { loadSettings, saveSettings, clearSettings } from '../src/Store'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

const stubMatchMedia = () => {
  ;(window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
  })
}

const rowNamed = (label: string) =>
  [...host.querySelectorAll('.settings-row')].find(
    (row) => row.querySelector('.settings-label')?.textContent === label,
  ) as HTMLElement

const click = (el: Element | null | undefined) => (el as HTMLElement).click()

describe('Settings window', () => {
  let content: SettingsContent

  beforeEach(async () => {
    stubMatchMedia()
    appearance.hydrate({ ...DEFAULT_APPEARANCE })
    host = document.createElement('div')
    document.body.appendChild(host)
    content = new SettingsContent()
    await content.load(host)
  })

  afterEach(async () => {
    await content.unload()
    host.remove()
    delete (window as any).matchMedia
    // Settings persist in the background, so let any in-flight write land
    // before clearing — otherwise it arrives during the next test.
    await new Promise((resolve) => setTimeout(resolve, 0))
    await clearSettings()
  })

  it('lays out every setting it offers', () => {
    expect(
      [...host.querySelectorAll('.settings-label')].map((e) => e.textContent),
    ).toEqual([
      'Theme',
      'Wallpaper',
      'Accent',
      'Corners',
      'Reduce motion',
      '24-hour clock',
      'Start again',
    ])
  })

  it('shows which option is in force', () => {
    const pressed = [...rowNamed('Theme').querySelectorAll('button')].filter(
      (b) => b.getAttribute('aria-pressed') === 'true',
    )
    expect(pressed).toHaveLength(1)
    expect(pressed[0].textContent).toBe('System')
  })

  it('pins the theme when one is picked', () => {
    const dark = [...rowNamed('Theme').querySelectorAll('button')].find(
      (b) => b.textContent === 'Dark',
    )
    click(dark)
    expect(appearance.get().theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('changes the accent, and with it the selection highlight', () => {
    const swatches = rowNamed('Accent').querySelectorAll('.settings-swatch')
    const moss = [...swatches].find(
      (s) => s.getAttribute('aria-label') === 'Moss',
    )
    click(moss)

    expect(appearance.get().accent).toBe('moss')
    const root = document.documentElement
    expect(root.style.getPropertyValue('--accent')).toBe(accentPalette.moss.light)
    expect(root.style.getPropertyValue('--selection')).toContain('rgba(')
  })

  it('changes every corner at once', () => {
    const sharp = [...rowNamed('Corners').querySelectorAll('button')].find(
      (b) => b.textContent === 'Sharp',
    )
    click(sharp)

    expect(appearance.get().corners).toBe('sharp')
    expect(document.documentElement.style.getPropertyValue('--radius-window')).toBe(
      cornerStyles.sharp.window,
    )
  })

  it('changes the wallpaper', () => {
    const fog = [...rowNamed('Wallpaper').querySelectorAll('.settings-swatch')].find(
      (s) => s.getAttribute('aria-label') === 'Fog',
    )
    click(fog)
    expect(appearance.get().wallpaper).toBe('fog')
  })

  it('flips the switches', () => {
    const before = appearance.get().reduceMotion
    const input = rowNamed('Reduce motion').querySelector<HTMLInputElement>(
      'input[type=checkbox]',
    )!
    input.checked = !before
    ;(input.closest('switch') as unknown as HTMLElement).click()

    expect(appearance.get().reduceMotion).toBe(!before)
  })

  it('puts everything back on reset', () => {
    appearance.set({ theme: 'dark', accent: 'sea', corners: 'round' })
    click(rowNamed('Start again').querySelector('.settings-reset'))

    expect(appearance.get()).toMatchObject({
      theme: DEFAULT_APPEARANCE.theme,
      accent: DEFAULT_APPEARANCE.accent,
      corners: DEFAULT_APPEARANCE.corners,
    })
  })

  it('redraws when appearance is changed from somewhere else', () => {
    appearance.set({ corners: 'round' })
    const pressed = [...rowNamed('Corners').querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-pressed') === 'true',
    )
    expect(pressed?.textContent).toBe('Round')
  })

  describe('uploading a wallpaper', () => {
    const upload = (file: File) => {
      const input = host.querySelector<HTMLInputElement>('.settings-upload input')!
      Object.defineProperty(input, 'files', { value: [file], configurable: true })
      input.dispatchEvent(new Event('change'))
    }

    const notice = () => host.querySelector('.settings-notice')?.textContent ?? ''

    it('takes an image and uses it as the wallpaper', async () => {
      upload(new File(['pretend png bytes'], 'sky.png', { type: 'image/png' }))

      await vi.waitFor(() =>
        expect(appearance.get().wallpaper).toBe('custom'),
      )
      expect(appearance.get().customWallpaper).toContain('data:')
      expect(
        document.documentElement.style.getPropertyValue('--wallpaper-sky'),
      ).toContain('url(')
    })

    it('says so, rather than silently ignoring a file that is not an image', async () => {
      upload(new File(['#!/bin/sh'], 'script.sh', { type: 'text/x-sh' }))
      await vi.waitFor(() => expect(notice()).toContain('not an image'))
      expect(appearance.get().wallpaper).not.toBe('custom')
    })

    /*
     * The image is kept as one data-URL string in IndexedDB, so a photo
     * straight off a camera would be tens of megabytes of it.
     */
    it('refuses an image too large to keep', async () => {
      const huge = new File(['x'], 'huge.png', { type: 'image/png' })
      Object.defineProperty(huge, 'size', { value: 20_000_000 })
      upload(huge)

      await vi.waitFor(() => expect(notice()).toContain('20MB'))
      expect(appearance.get().wallpaper).not.toBe('custom')
    })

    it('offers to remove a picture once there is one, and falls back', async () => {
      upload(new File(['bytes'], 'sky.png', { type: 'image/png' }))
      await vi.waitFor(() =>
        expect(host.querySelector('.settings-reset.is-inline')).toBeTruthy(),
      )

      click(host.querySelector('.settings-reset.is-inline'))
      expect(appearance.get().customWallpaper).toBeUndefined()
      expect(appearance.get().wallpaper).toBe(DEFAULT_APPEARANCE.wallpaper)
    })
  })
})

describe('settings storage', () => {
  beforeEach(async () => {
    await clearSettings()
  })

  afterEach(async () => {
    await clearSettings()
  })

  it('round-trips values of every shape', async () => {
    await saveSettings({ theme: 'dark', clock24: false, wallpaper: 'fog' })
    expect(await loadSettings()).toEqual({
      theme: 'dark',
      clock24: false,
      wallpaper: 'fog',
    })
  })

  it('overwrites rather than duplicating a setting', async () => {
    await saveSettings({ theme: 'dark' })
    await saveSettings({ theme: 'light' })

    expect(await loadSettings()).toEqual({ theme: 'light' })
    expect(await db.settings.count()).toBe(1)
  })

  // A row written by an older build should cost that one setting, not the boot.
  it('skips a row it cannot read instead of failing to start', async () => {
    await saveSettings({ theme: 'dark' })
    await db.settings.put({ code: 'accent', value: 'not json' } as never)

    const loaded = await loadSettings()
    expect(loaded).toEqual({ theme: 'dark' })
  })

  it('clears everything', async () => {
    await saveSettings({ theme: 'dark' })
    await clearSettings()
    expect(await loadSettings()).toEqual({})
  })
})
