import { describe, it, expect, vi, beforeEach } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'

jss.setup(preset())
jss.use(nested())

// Blur works on a real canvas, which jsdom does not provide. Swap in a stub so
// blurimage's own plumbing (image element, onload, resolve) can be exercised.
vi.mock('../src/utils/blur', () => ({
  default: class BlurStub {
    constructor(public options: any) {}
    init() {}
    blurRGBA() {
      return { toDataURL: () => 'data:image/png;base64,blurred' }
    }
  },
}))

describe('blurImage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('resolves with a data URL once the source image loads', async () => {
    const { blurImage } = await import('../src/utils/blurimage')

    const pending = blurImage('/assets/bg.jpg', 30)

    // The helper appends a hidden <img> and waits on its load event.
    const img = document.body.querySelector('img')!
    expect(img).toBeTruthy()
    expect(img.getAttribute('crossorigin')).toBe('Anonymous')
    expect(img.style.opacity).toBe('0')

    img.onload!(new Event('load'))
    await vi.advanceTimersByTimeAsync(500)

    await expect(pending).resolves.toBe('data:image/png;base64,blurred')
    vi.useRealTimers()
  })

  it('falls back to a default radius when none is given', async () => {
    const { blurImage } = await import('../src/utils/blurimage')

    const pending = blurImage('/assets/bg.jpg', undefined)
    const img = document.body.querySelector('img')!
    img.onload!(new Event('load'))
    await vi.advanceTimersByTimeAsync(500)

    await expect(pending).resolves.toBe('data:image/png;base64,blurred')
    vi.useRealTimers()
  })
})

describe('Bootlogo', () => {
  it('renders the flower petals', async () => {
    const { default: Bootlogo } = await import('../src/components/Bootscreen/bootlogo')
    const host = document.createElement('div')
    document.body.appendChild(host)

    const logo = new Bootlogo()
    await logo.load(host)

    expect(logo.getElement().querySelector('#flower')).toBeTruthy()
    expect(logo.getElement().querySelectorAll('.petal')).toHaveLength(3)
    vi.useRealTimers()
  })

  it('fades out before unloading', async () => {
    vi.useFakeTimers()
    const { default: Bootlogo } = await import('../src/components/Bootscreen/bootlogo')
    const host = document.createElement('div')
    document.body.appendChild(host)

    const logo = new Bootlogo()
    await logo.load(host)

    const unloading = logo.unload()
    await vi.advanceTimersByTimeAsync(250)
    await unloading

    expect(logo.getElement().style.opacity).toBe('0')
    expect(host.contains(logo.getElement())).toBe(false)
    vi.useRealTimers()
  })
})
