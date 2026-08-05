import { describe, it, expect, vi, beforeEach } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'

jss.setup(preset())
jss.use(nested())

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
