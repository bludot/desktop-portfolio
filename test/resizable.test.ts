import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import Resizable from '../src/utils/resizable'
import OSElement from '../src/utils/OSElement'

jss.setup(preset())
jss.use(nested())

// Borders are created in this order by the factory, one per resize direction.
const ORDER = [
  'top',
  'right',
  'bottom',
  'left',
  'bottomright',
  'bottomleft',
  'topleft',
  'topright',
] as const

let target: OSElement
let borders: HTMLElement[]

const setGeometry = (el: HTMLElement) => {
  Object.defineProperty(el, 'clientWidth', { value: 400, configurable: true })
  Object.defineProperty(el, 'clientHeight', { value: 300, configurable: true })
  Object.defineProperty(el, 'offsetLeft', { value: 100, configurable: true })
  Object.defineProperty(el, 'offsetTop', { value: 50, configurable: true })
}

const drag = (border: HTMLElement, dx: number, dy: number) => {
  border.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, clientX: 200, clientY: 200 }),
  )
  window.dispatchEvent(
    new MouseEvent('mousemove', { bubbles: true, clientX: 200 + dx, clientY: 200 + dy }),
  )
  window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
}

const box = () => ({
  left: target.getElement().style.left,
  top: target.getElement().style.top,
  width: target.getElement().style.width,
  height: target.getElement().style.height,
})

describe('Resizable', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    const host = document.createElement('div')
    document.body.appendChild(host)

    target = new OSElement('div', 'resize-target')
    target.style = () => ({ 'resize-target': { color: 'red' } })
    await target.load(host)
    setGeometry(target.getElement())

    Resizable(target)
    // Each border wires its mousedown inside a setTimeout(0).
    await vi.advanceTimersByTimeAsync(0)

    borders = Array.from(
      target.getElement().querySelectorAll<HTMLElement>(':scope > .border'),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds one border per resize direction', () => {
    expect(borders).toHaveLength(ORDER.length)
  })

  it('resizing from the right edge widens without moving the box', () => {
    drag(borders[ORDER.indexOf('right')], 50, 0)
    expect(box()).toEqual({ left: '100px', top: '50px', width: '450px', height: '300px' })
  })

  it('resizing from the bottom edge grows the height only', () => {
    drag(borders[ORDER.indexOf('bottom')], 0, 40)
    expect(box()).toEqual({ left: '100px', top: '50px', width: '400px', height: '340px' })
  })

  it('resizing from the left edge moves the origin and shrinks the width', () => {
    drag(borders[ORDER.indexOf('left')], 30, 0)
    expect(box()).toEqual({ left: '130px', top: '50px', width: '370px', height: '300px' })
  })

  it('resizing from the top edge moves the origin and shrinks the height', () => {
    drag(borders[ORDER.indexOf('top')], 0, 20)
    expect(box()).toEqual({ left: '100px', top: '70px', width: '400px', height: '280px' })
  })

  it('the bottom-right corner grows both dimensions', () => {
    drag(borders[ORDER.indexOf('bottomright')], 25, 35)
    expect(box()).toEqual({ left: '100px', top: '50px', width: '425px', height: '335px' })
  })

  it('the bottom-left corner moves x and grows the height', () => {
    drag(borders[ORDER.indexOf('bottomleft')], 25, 35)
    expect(box()).toEqual({ left: '125px', top: '50px', width: '375px', height: '335px' })
  })

  it('the top-left corner moves both origins', () => {
    drag(borders[ORDER.indexOf('topleft')], 25, 35)
    expect(box()).toEqual({ left: '125px', top: '85px', width: '375px', height: '265px' })
  })

  it('the top-right corner moves y and grows the width', () => {
    drag(borders[ORDER.indexOf('topright')], 25, 35)
    expect(box()).toEqual({ left: '100px', top: '85px', width: '425px', height: '265px' })
  })

  it('stops resizing once the mouse is released', () => {
    const right = borders[ORDER.indexOf('right')]
    drag(right, 50, 0)
    const after = box()

    // A stray move with no button down must not resize further.
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 900, clientY: 900 }))
    expect(box()).toEqual(after)
  })
})
