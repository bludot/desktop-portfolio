import { describe, it, expect, vi, beforeEach } from 'vitest'
import Logger, { GlobalLogger } from '../src/Logger'
import { Log } from '../src/Logger/Log'
import { LOG_TYPE } from '../src/Logger/interfaces'

describe('Log', () => {
  it('formats a message with timestamp and level', () => {
    const log = new Log(LOG_TYPE.INFO, 'hello')
    expect(log.type).toBe(LOG_TYPE.INFO)
    expect(log.message).toBe('hello')
    expect(log.timestamp).toBeInstanceOf(Date)
    expect(log.formattedMessage).toMatch(/^\[.+\] \[INFO\] hello$/)
  })

  it('prefixes the service name when one is supplied', () => {
    const log = new Log(LOG_TYPE.ERROR, 'boom', 'Bootsequence')
    expect(log.formattedMessage).toMatch(/^\[Bootsequence\] \[.+\] \[ERROR\] boom$/)
  })

  it('service() sets the name and returns the log for chaining', () => {
    const log = new Log(LOG_TYPE.DEBUG, 'x')
    expect(log.service('Desktop')).toBe(log)
    expect(log.serviceName).toBe('Desktop')
  })

  it('re-formatting after service() picks up the new name', () => {
    const log = new Log(LOG_TYPE.TRACE, 'x')
    log.service('Taskbar')
    expect(log.formatMessage()).toContain('[Taskbar]')
  })
})

describe('GlobalLogger', () => {
  it('is a singleton', () => {
    expect(GlobalLogger.getInstance()).toBe(GlobalLogger.getInstance())
  })

  it('records logs and notifies subscribers', () => {
    const global = GlobalLogger.getInstance()
    const before = global.getLogs().length
    const handler = vi.fn()
    global.subscribe('log', handler)

    const log = new Log(LOG_TYPE.INFO, 'recorded')
    global.log(log)

    expect(handler).toHaveBeenCalledWith(log)
    const logs = global.getLogs()
    expect(logs.length).toBe(before + 1)
    expect(logs[logs.length - 1]).toBe(log)
  })
})

describe('Logger', () => {
  let logger: Logger

  beforeEach(() => {
    logger = new Logger('TestService')
  })

  it('starts empty', () => {
    expect(logger.getLogs()).toEqual([])
    expect(logger.getLastLog()).toBeUndefined()
  })

  it.each([
    ['info', LOG_TYPE.INFO],
    ['warn', LOG_TYPE.WARNING],
    ['error', LOG_TYPE.ERROR],
    ['debug', LOG_TYPE.DEBUG],
  ])('%s() records a log at the matching level', (method, type) => {
    logger[method]('a message')
    const last = logger.getLastLog()
    expect(last.type).toBe(type)
    expect(last.message).toBe('a message')
    expect(last.serviceName).toBe('TestService')
  })

  it.each(['info', 'warn', 'error', 'debug'])(
    '%s() records one log per argument',
    (method) => {
      logger[method]('one', 'two', 'three')
      expect(logger.getLogs()).toHaveLength(3)
      expect(logger.getLogs().map((l) => l.message)).toEqual(['one', 'two', 'three'])
    },
  )

  it('getLastLogs returns the newest n in order', () => {
    logger.info('a')
    logger.info('b')
    logger.info('c')
    expect(logger.getLastLogs(2).map((l) => l.message)).toEqual(['b', 'c'])
  })

  it('clearLogs empties the buffer', () => {
    logger.info('a')
    logger.clearLogs()
    expect(logger.getLogs()).toEqual([])
  })

  it('forwards each log to the global logger', () => {
    const global = GlobalLogger.getInstance()
    const before = global.getLogs().length
    logger.info('forwarded')
    expect(global.getLogs().length).toBeGreaterThan(before)
  })
})
