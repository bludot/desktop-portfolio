import { describe, it, expect, beforeEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import OSElement from '../src/utils/OSElement'

// index.ts does this at boot; the components assume it has happened.
jss.setup(preset())
jss.use(nested())

const makeElement = (id = 'thing') => {
  const el = new OSElement('div', id, 'Thing')
  el.style = () => ({ [id]: { color: 'red' } })
  return el
}

describe('OSElement', () => {
  let host: HTMLElement

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
  })

  it('creates the backing element with the given tag and id', () => {
    const el = new OSElement('section', 'my-id')
    expect(el.getElement().tagName).toBe('SECTION')
    expect(el.getElement().id).toBe('my-id')
    expect(el.id).toBe('my-id')
  })

  it('defaults the instance name to the tag name', () => {
    expect(new OSElement('div', 'a').instanceName).toBe('div')
    expect(new OSElement('div', 'b', 'Named').instanceName).toBe('Named')
  })

  it('appends itself to the parent on load', async () => {
    const el = makeElement()
    await el.load(host)
    expect(host.contains(el.getElement())).toBe(true)
    expect(el.parent).toBe(host)
  })

  it('applies a generated class name on load', async () => {
    const el = makeElement()
    await el.load(host)
    expect(el.getElement().className).toContain('thing')
    expect(el.styleSheet).toBeTruthy()
  })

  it('uses an explicit className when one is set', async () => {
    const el = makeElement()
    el.className = 'preset-class'
    await el.load(host)
    expect(el.getElement().className).toContain('preset-class')
  })

  it('runs the load hooks in order', async () => {
    const el = makeElement()
    const calls: string[] = []
    el.beforeLoad = async () => void calls.push('before')
    el.afterLoad = async () => void calls.push('after')
    await el.load(host)
    expect(calls).toEqual(['before', 'after'])
  })

  it('refuses to load twice', async () => {
    const el = makeElement()
    await el.load(host)
    await expect(el.load(host)).rejects.toThrow('Already loaded')
  })

  it('detaches from the DOM on unload', async () => {
    const el = makeElement()
    await el.load(host)
    await el.unload()
    expect(host.contains(el.getElement())).toBe(false)
    expect(el.parent).toBeNull()
    expect(el.styleSheet).toBeNull()
  })

  it('runs the unload hooks in order', async () => {
    const el = makeElement()
    await el.load(host)
    const calls: string[] = []
    el.beforeUnload = async () => void calls.push('before')
    el.afterUnload = async () => void calls.push('after')
    await el.unload()
    expect(calls).toEqual(['before', 'after'])
  })

  it('can be loaded again after unloading', async () => {
    const el = makeElement()
    await el.load(host)
    await el.unload()
    await expect(el.load(host)).resolves.not.toThrow()
    expect(host.contains(el.getElement())).toBe(true)
  })

  it('replaces the stylesheet when styles are re-applied', async () => {
    const el = makeElement()
    await el.load(host)
    const first = el.styleSheet
    const detach = vi.spyOn(first, 'detach')
    el.applyStyle()
    expect(detach).toHaveBeenCalled()
    expect(el.styleSheet).not.toBe(first)
  })

  it('unloadStyle is safe to call when no sheet is attached', () => {
    const el = new OSElement('div', 'bare')
    expect(() => el.unloadStyle()).not.toThrow()
  })

  it('updateDimension writes position and size as pixels', () => {
    const el = new OSElement('div', 'sized')
    el.updateDimension(10, 20, 300, 400)
    const style = el.getElement().style
    expect(style.left).toBe('10px')
    expect(style.top).toBe('20px')
    expect(style.width).toBe('300px')
    expect(style.height).toBe('400px')
  })
})
