import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ThemeEngine,
  light,
  dark,
  accentLayer,
  accentPalette,
  cornersLayer,
  cornerStyles,
  wallpaperLayer,
  customWallpaperLayer,
  shade,
  withAlpha,
  type Theme,
} from '../src/theme'
import appearance, { DEFAULT_APPEARANCE, resolveTheme } from '../src/utils/appearance'

const root = () => document.documentElement

describe('ThemeEngine', () => {
  let engine: ThemeEngine

  beforeEach(() => {
    engine = new ThemeEngine().register(light, dark)
    root().removeAttribute('style')
    root().removeAttribute('data-theme')
  })

  it('registers themes and hands them back by id', () => {
    expect(engine.get('light')).toBe(light)
    expect(engine.list().map((t) => t.id)).toEqual(['light', 'dark'])
  })

  it('writes every token to the root element', () => {
    engine.apply('light')
    expect(root().style.getPropertyValue('--ink')).toBe(light.tokens['--ink'])
    expect(root().dataset.theme).toBe('light')
    expect(root().style.colorScheme).toBe('light')
  })

  // A stored preference can outlive the theme it names; that should fall back,
  // not take the desktop down on boot.
  it('ignores an unknown theme rather than throwing', () => {
    engine.apply('light')
    expect(engine.apply('theme-that-was-deleted')).toBeUndefined()
    expect(engine.active()?.id).toBe('light')
  })

  it('layers tokens over the theme, last one winning', () => {
    const first = { id: 'a', name: 'A', tokens: () => ({ '--ink': 'red', '--x': '1' }) }
    const second = { id: 'b', name: 'B', tokens: () => ({ '--ink': 'blue' }) }

    const tokens = engine.compose(light, [first, second])
    expect(tokens['--ink']).toBe('blue')
    expect(tokens['--x']).toBe('1')
    // Untouched theme tokens survive.
    expect(tokens['--desktop']).toBe(light.tokens['--desktop'])
  })

  it('gives layers the scheme in force, so one accent covers both themes', () => {
    const seen: string[] = []
    const spy = { id: 's', name: 'S', tokens: (scheme: string) => { seen.push(scheme); return {} } }

    engine.apply('light', [spy])
    engine.apply('dark', [spy])
    expect(seen).toEqual(['light', 'dark'])
  })

  it('drops tokens a new theme no longer defines', () => {
    const extra: Theme = {
      id: 'extra',
      name: 'Extra',
      scheme: 'light',
      tokens: { ...light.tokens, '--only-here': '1px' },
    }
    engine.register(extra)

    engine.apply('extra')
    expect(root().style.getPropertyValue('--only-here')).toBe('1px')

    engine.apply('light')
    expect(root().style.getPropertyValue('--only-here')).toBe('')
  })

  it('tells subscribers what went on screen', () => {
    const seen: string[] = []
    const subscription = engine.subscribe((theme) => seen.push(theme.id))

    engine.apply('dark')
    subscription.unsubscribe()
    engine.apply('light')

    expect(seen).toEqual(['dark'])
  })
})

describe('layers', () => {
  it('lifts the accent on dark, because the paper hue turns to mud', () => {
    const rose = accentLayer('rose')
    expect(rose.tokens('light')['--accent']).toBe(accentPalette.rose.light)
    expect(rose.tokens('dark')['--accent']).toBe(accentPalette.rose.dark)
    expect(rose.tokens('light')['--accent']).not.toBe(rose.tokens('dark')['--accent'])
  })

  it('draws the selection highlight from the accent', () => {
    const sea = accentLayer('sea').tokens('light')
    expect(sea['--selection']).toContain('rgba(')
    // Same hue as the accent it came from.
    expect(sea['--selection']).toContain('63, 111, 125')
  })

  it('falls back to the default accent when the stored one is gone', () => {
    expect(accentLayer('vermilion').id).toBe('rose')
  })

  it('moves every corner together', () => {
    const round = cornersLayer('round').tokens('light')
    expect(round['--radius-window']).toBe(cornerStyles.round.window)
    expect(round['--radius-pill']).toBe(cornerStyles.round.pill)

    const sharp = cornersLayer('sharp').tokens('light')
    expect(Object.values(sharp).every((v) => v === '0px')).toBe(true)
  })

  it('falls back to the default corners when the stored one is gone', () => {
    expect(cornersLayer('bevelled').id).toBe('soft')
  })

  it('gives each wallpaper its own dark sky rather than dimming the light one', () => {
    const dawn = wallpaperLayer('dawn')
    expect(dawn.tokens('light')['--wallpaper-sky']).not.toBe(
      dawn.tokens('dark')['--wallpaper-sky'],
    )
  })

  /*
   * The bands and glow exist to give a flat gradient depth. Over a photograph
   * they just read as smears, so an uploaded picture switches them off.
   */
  it('switches the drawn bands off behind an uploaded picture', () => {
    const tokens = customWallpaperLayer('data:image/png;base64,AAA').tokens('light')
    expect(tokens['--wallpaper-sky']).toContain('url("data:image/png;base64,AAA")')
    expect(tokens['--wallpaper-sun']).toBe('none')
    expect(tokens['--wallpaper-ridge-0']).toBe('transparent')
  })
})

describe('colour helpers', () => {
  it('darkens a hex without leaving the range', () => {
    expect(shade('#808080', -0.5)).toBe('#404040')
    expect(shade('#000000', -0.5)).toBe('#000000')
    expect(shade('#ffffff', 1)).toBe('#ffffff')
  })

  it('leaves anything that is not a plain hex alone', () => {
    expect(shade('var(--accent)', -0.2)).toBe('var(--accent)')
    expect(withAlpha('rgb(1,2,3)', 0.5)).toBe('rgb(1,2,3)')
  })

  it('keeps the hue and adds the alpha', () => {
    expect(withAlpha('#3f6f7d', 0.28)).toBe('rgba(63, 111, 125, 0.28)')
  })
})

describe('appearance', () => {
  const stubMatchMedia = (dark: boolean) => {
    ;(window as any).matchMedia = (query: string) => ({
      matches: dark && query.includes('dark'),
      media: query,
      addEventListener: () => {},
    })
  }

  afterEach(() => {
    delete (window as any).matchMedia
    appearance.hydrate({ ...DEFAULT_APPEARANCE })
  })

  it('resolves "system" against the device and pins everything else', () => {
    stubMatchMedia(true)
    expect(resolveTheme('system')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')

    stubMatchMedia(false)
    expect(resolveTheme('system')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('puts a change on screen and tells subscribers', () => {
    stubMatchMedia(false)
    const seen: string[] = []
    const subscription = appearance.subscribe((next) => seen.push(next.accent))

    appearance.set({ accent: 'moss' })
    expect(appearance.get().accent).toBe('moss')
    expect(root().style.getPropertyValue('--accent')).toBe(accentPalette.moss.light)
    expect(seen).toEqual(['moss'])

    subscription.unsubscribe()
  })

  // "custom" with nothing uploaded would otherwise show the default sky under
  // a label claiming it was your picture.
  it('falls back to a drawn sky when custom is chosen with no image', () => {
    stubMatchMedia(false)
    appearance.set({ wallpaper: 'custom', customWallpaper: undefined })
    expect(root().style.getPropertyValue('--wallpaper-sky')).toContain('linear-gradient')
  })

  it('uses the uploaded image once there is one', () => {
    stubMatchMedia(false)
    appearance.set({ wallpaper: 'custom', customWallpaper: 'data:image/png;base64,ZZZ' })
    expect(root().style.getPropertyValue('--wallpaper-sky')).toContain('url(')
  })

  it('hands back a copy, so callers cannot edit the live settings', () => {
    const snapshot = appearance.get()
    snapshot.accent = 'tampered'
    expect(appearance.get().accent).not.toBe('tampered')
  })
})
