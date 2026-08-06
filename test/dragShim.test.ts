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

  it('raises the shim on the press and drops it on the release', () => {
    const right = borders[1]

    right.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 200, clientY: 200 }))
    expect(shim()).toBeTruthy()
    // The edge's own cursor, held across the whole screen.
    expect(shim()!.style.cursor).toBe('ew-resize')

    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    expect(shim()).toBeNull()
  })
})
