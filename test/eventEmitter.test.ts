import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from '../src/EventEmitter'

describe('EventEmitter', () => {
  it('starts with no events, or adopts the ones it is given', () => {
    expect(new EventEmitter().events).toEqual({})
    const seeded = { boot: [] }
    expect(new EventEmitter(seeded).events).toBe(seeded)
  })

  it('calls every subscriber with the emitted arguments', () => {
    const emitter = new EventEmitter()
    const first = vi.fn()
    const second = vi.fn()
    emitter.subscribe('boot', first)
    emitter.subscribe('boot', second)

    emitter.emit('boot', 1, 'two')

    expect(first).toHaveBeenCalledWith(1, 'two')
    expect(second).toHaveBeenCalledWith(1, 'two')
  })

  it('ignores emits for names nobody subscribed to', () => {
    expect(() => new EventEmitter().emit('nobody-home')).not.toThrow()
  })

  it('stops calling a handler once unsubscribed', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()
    const sub = emitter.subscribe('boot', handler)

    emitter.emit('boot')
    sub.unsubscribe()
    emitter.emit('boot')

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('unsubscribing one handler leaves the others attached', () => {
    const emitter = new EventEmitter()
    const kept = vi.fn()
    const dropped = vi.fn()
    emitter.subscribe('boot', kept)
    const sub = emitter.subscribe('boot', dropped)

    sub.unsubscribe()
    emitter.emit('boot')

    expect(kept).toHaveBeenCalledTimes(1)
    expect(dropped).not.toHaveBeenCalled()
  })

  it('on is an alias for subscribe', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()
    emitter.on('boot', handler)
    emitter.emit('boot')
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
