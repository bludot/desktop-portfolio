import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import FluentButton from '../src/components/FluentButton'

let root: HTMLElement

const makeButton = (opts: Record<string, unknown> = {}) =>
  new FluentButton(root, { text: 'Click me', icon: '', onClick: null, ...opts } as any)

describe('FluentButton', () => {
  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    FluentButton.elements.clear()
    FluentButton.outerRevealElements.clear()
    FluentButton.observingOuterReveal = false
  })

  it('renders its markup into the root element', () => {
    const button = makeButton()
    expect(root.innerHTML).not.toBe('')
    expect(root.textContent).toContain('Click me')
    expect(button.el).toBe(root.firstElementChild)
  })

  it('accepts a selector string for the root', () => {
    root.id = 'fluent-host'
    const button = new FluentButton('#fluent-host', { text: 'By selector' } as any)
    expect(button.rootEl).toBe(root)
    expect(root.textContent).toContain('By selector')
  })

  it('does not re-initialise a root it already owns', () => {
    makeButton()
    const html = root.innerHTML
    makeButton({ text: 'Second' })
    expect(root.innerHTML).toBe(html)
  })

  it('wires an onClick handler when given one', () => {
    const onClick = vi.fn()
    const button = makeButton({ onClick })
    button.el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClick).toHaveBeenCalled()
  })

  it('updateCoordinates writes CSS custom properties', () => {
    const button = makeButton()
    const target = document.createElement('div')
    Object.defineProperty(target, 'offsetLeft', { value: 10 })
    Object.defineProperty(target, 'offsetTop', { value: 20 })

    const { x, y } = button.updateCoordinates({
      pageX: 60,
      pageY: 70,
      currentTarget: target,
    })

    expect(x).toBe(50)
    expect(y).toBe(50)
    expect(target.style.getPropertyValue('--x')).toBe('50px')
    expect(target.style.getPropertyValue('--y')).toBe('50px')
  })

  it('adds and removes the pressed state class', () => {
    const button = makeButton()
    const target = document.createElement('div')

    button.addPressedState({ currentTarget: target })
    expect(target.classList.contains('fluent-btn--pressed')).toBe(true)

    button.removePressedState({ currentTarget: target })
    expect(target.classList.contains('fluent-btn--pressed')).toBe(false)
  })

  it('startRipple re-adds the ripple class after a beat', () => {
    vi.useFakeTimers()
    const button = makeButton()
    const target = document.createElement('div')
    target.classList.add('fluent-btn--ripple')

    button.startRipple({ currentTarget: target })
    expect(target.classList.contains('fluent-btn--ripple')).toBe(false)

    vi.advanceTimersByTime(25)
    expect(target.classList.contains('fluent-btn--ripple')).toBe(true)
    vi.useRealTimers()
  })

  it('isInRevealThreshold covers points near the element', () => {
    const button = makeButton()
    const box = { width: 100, height: 40 }
    expect(button.isInRevealThreshold({ x: 50, y: 20, ...box })).toBe(true)
    expect(button.isInRevealThreshold({ x: -10, y: 20, ...box })).toBe(true)
    expect(button.isInRevealThreshold({ x: 1000, y: 20, ...box })).toBe(false)
    expect(button.isInRevealThreshold({ x: 50, y: -1000, ...box })).toBe(false)
  })

  it('getElementDimensions reads the bounding box', () => {
    const button = makeButton()
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({ width: 120, height: 44 }) as DOMRect
    expect(button.getElementDimensions(el)).toEqual({ width: 120, height: 44 })
  })

  it('outer reveal mode registers the element and starts observing', () => {
    root.getBoundingClientRect = () => ({ width: 100, height: 40 }) as DOMRect
    const button = makeButton({ outerReveal: true })
    expect(FluentButton.outerRevealElements.has(button.el)).toBe(true)
    expect(FluentButton.observingOuterReveal).toBe(true)
  })

  it('updateOuterReveal toggles the reveal class by proximity', () => {
    const button = makeButton()
    const near = document.createElement('div')
    Object.defineProperty(near, 'offsetLeft', { value: 0 })
    Object.defineProperty(near, 'offsetTop', { value: 0 })
    FluentButton.outerRevealElements.set(near, { width: 100, height: 40 })

    button.updateOuterReveal({ pageX: 50, pageY: 20 })
    expect(near.classList.contains('fluent-btn--reveal')).toBe(true)

    button.updateOuterReveal({ pageX: 5000, pageY: 5000 })
    expect(near.classList.contains('fluent-btn--reveal')).toBe(false)
  })

  it('updateElementDimensions refreshes every tracked element', () => {
    const button = makeButton()
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({ width: 200, height: 60 }) as DOMRect
    FluentButton.outerRevealElements.set(el, { width: 0, height: 0 })

    button.updateElementDimensions()

    expect(FluentButton.outerRevealElements.get(el)).toEqual({ width: 200, height: 60 })
  })

  it('destroy empties the root and forgets the element', () => {
    const button = makeButton()
    button.destroy()
    expect(root.innerHTML).toBe('')
    expect(FluentButton.elements.has(root)).toBe(false)
  })
})
