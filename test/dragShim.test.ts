import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import { raiseDragShim, dropDragShim } from '../src/utils/dragShim'
import Resizable from '../src/utils/resizable'
import OSElement from '../src/utils/OSElement'

jss.setup(preset())
jss.use(nested())

const shim = () => document.querySelector<HTMLElement>('.drag-shim')

/*
 * Why any of this exists: a drag listens on `window`, and a cross-origin frame
 * the pointer crosses takes those events into its own document instead. The
 * moves stop arriving mid-gesture and the release is swallowed with them, so
 * the drag is left running. Nothing can be read or intercepted inside the
 * frame, so it is covered for the length of the gesture instead.
 */
describe('the drag shim', () => {
  afterEach(() => {
    dropDragShim()
  })

  it('covers the whole screen, above every window', () => {
    raiseDragShim()

    const el = shim()!
    expect(el).toBeTruthy()
    expect(el.style.position).toBe('fixed')
    expect(el.style.inset).toBe('0px')
    // Over the windows, the taskbar and the overview.
    expect(Number(el.style.zIndex)).toBeGreaterThan(9000)
  })

  // It is a way of holding on to the pointer, not a thing on the screen.
  it('is unpainted and hidden from assistive technology', () => {
    raiseDragShim()

    expect(shim()!.style.backgroundColor).toBe('')
    expect(shim()!.getAttribute('aria-hidden')).toBe('true')
  })

  /*
   * Without this, a resize that wanders off the 6px border flickers back to
   * whatever is underneath — a caret over prose, a pointer over a link — while
   * the resize is still happening.
   */
  it('carries the cursor of the gesture that raised it', () => {
    raiseDragShim('nwse-resize')
    expect(shim()!.style.cursor).toBe('nwse-resize')

    dropDragShim()
    raiseDragShim('grabbing')
    expect(shim()!.style.cursor).toBe('grabbing')
  })

  it('leaves nothing behind when the drag ends', () => {
    raiseDragShim()
    dropDragShim()

    expect(shim()).toBeNull()
  })

  // Every release path calls it, including those that never raised one.
  it('can be dropped when none was raised', () => {
    expect(() => dropDragShim()).not.toThrow()
  })

  /*
   * The backstop. A sheet left up covers the desktop and silently eats every
   * click on it, which reads as the whole page having died — so it comes down
   * on the next release even if the gesture that raised it never says so.
   */
  it('takes itself down on the next release, with no help from the caller', () => {
    raiseDragShim('grabbing')
    expect(shim()).toBeTruthy()

    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))

    expect(shim()).toBeNull()
  })

  // One gesture at a time: a second raise must not leave the first on screen.
  it('never stacks', () => {
    raiseDragShim('grabbing')
    raiseDragShim('ew-resize')

    expect(document.querySelectorAll('.drag-shim')).toHaveLength(1)
    dropDragShim()
    expect(shim()).toBeNull()
  })
})

describe('a resize gesture', () => {
  let target: OSElement
  let borders: HTMLElement[]

  beforeEach(async () => {
    vi.useFakeTimers()
    const host = document.createElement('div')
    document.body.appendChild(host)

    target = new OSElement('div', 'shim-resize-target')
    target.style = () => ({ 'shim-resize-target': { color: 'red' } })
    await target.load(host)

    Resizable(target)
    await vi.advanceTimersByTimeAsync(0)

    borders = Array.from(
      target.getElement().querySelectorAll<HTMLElement>(':scope > .border'),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    dropDragShim()
  })

  /*
   * The press alone must raise nothing. A `click` only fires when the press
   * and the release land on the same element, so a sheet up before the release
   * catches it instead and the click never happens — which is exactly how the
   * window controls stopped closing windows: they sit inside the titlebar that
   * raised the sheet over them.
   */
  it('leaves the screen alone until the pointer actually moves', () => {
    const right = borders[1]

    right.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 200, clientY: 200 }))
    expect(shim()).toBeNull()

    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 240, clientY: 200 }))
    expect(shim()).toBeTruthy()
    // The edge's own cursor, held across the whole screen.
    expect(shim()!.style.cursor).toBe('ew-resize')

    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    expect(shim()).toBeNull()
  })

  // A press and release with no movement between them is a click, and every
  // button on this desktop acts on one.
  it('lets a click through when nothing was dragged', () => {
    const right = borders[1]
    const clicks: string[] = []
    const button = document.createElement('button')
    button.addEventListener('click', () => clicks.push('hit'))
    document.body.appendChild(button)

    right.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 200, clientY: 200 }))
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))

    // Nothing was ever in the way, so the press and release share a target.
    expect(shim()).toBeNull()
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(clicks).toEqual(['hit'])
    button.remove()
  })
})
