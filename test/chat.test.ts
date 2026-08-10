import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import ChatContent from '../src/contents/chat'
import { setChatEngine, type ChatEngine, type Message } from '../src/ai/chat'
import { FEATURE_FLAG_DEFAULTS } from '../src/Store'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

/** A model that answers instantly, in pieces, without fetching anything. */
const stubEngine = (over: Partial<ChatEngine> = {}): ChatEngine => ({
  device: 'wasm',
  load: vi.fn().mockResolvedValue(undefined),
  reply: vi.fn(async (_messages: Message[], onToken: (t: string) => void) => {
    onToken('Hel')
    onToken('lo.')
    return 'Hello.'
  }),
  dispose: vi.fn(),
  ...over,
})

const input = () => host.querySelector<HTMLTextAreaElement>('.chat-input')!
const send = () => host.querySelector<HTMLButtonElement>('.chat-send')!
const status = () => host.querySelector<HTMLElement>('.chat-status')!
const turns = () =>
  [...host.querySelectorAll<HTMLElement>('.chat-turn')].map((turn) => ({
    who: turn.querySelector('.chat-who')?.textContent,
    said: turn.querySelector('.chat-said')?.textContent,
  }))

const ask = async (content: HTMLElement, text: string) => {
  input().value = text
  host.querySelector<HTMLFormElement>('.chat-form')!.dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  )
  await vi.waitFor(() => expect(input().disabled).toBe(false))
  return content
}

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  setChatEngine(undefined)
  host.remove()
})

describe('the chat window', () => {
  /*
   * The whole point of the flag: opening this window is the only thing on the
   * desktop that fetches a model, and it does not happen a moment earlier.
   */
  it('ships behind a flag that is off', () => {
    expect(FEATURE_FLAG_DEFAULTS.localChat.enabled).toBe(false)
  })

  it('loads the model only once it is opened', async () => {
    const engine = stubEngine()
    const content = new ChatContent(engine)

    // Built, but not mounted: nothing has been asked of the model yet.
    expect(engine.load).not.toHaveBeenCalled()

    await content.load(host)
    await vi.waitFor(() => expect(engine.load).toHaveBeenCalled())
    await content.unload()
  })

  // A hundred megabytes is a wait somebody should be able to watch, so the
  // window opens straight away and says how far along it is.
  it('opens immediately and counts the download in', async () => {
    let report: ((fraction: number) => void) | undefined
    const engine = stubEngine({
      load: vi.fn(
        (onProgress?: (f: number) => void) =>
          new Promise<void>((resolve) => {
            report = (fraction) => {
              onProgress?.(fraction)
              if (fraction >= 1) resolve()
            }
          }),
      ) as ChatEngine['load'],
    })
    const content = new ChatContent(engine)
    await content.load(host)

    await vi.waitFor(() => expect(status().textContent).toContain('Downloading'))
    report!(0.42)
    expect(status().textContent).toContain('42%')

    // Nothing can be typed until there is something to answer with.
    expect(input().disabled).toBe(true)

    report!(1)
    await vi.waitFor(() => expect(input().disabled).toBe(false))
    await content.unload()
  })

  it('says where it ended up running', async () => {
    const content = new ChatContent(stubEngine({ device: 'webgpu' }))
    await content.load(host)

    await vi.waitFor(() => expect(status().textContent).toContain('GPU'))
    await content.unload()
  })

  it('answers, a token at a time', async () => {
    const engine = stubEngine()
    const content = new ChatContent(engine)
    await content.load(host)
    await vi.waitFor(() => expect(input().disabled).toBe(false))

    await ask(content.getElement(), 'hello there')

    expect(turns()).toEqual([
      { who: 'You', said: 'hello there' },
      { who: 'Model', said: 'Hello.' },
    ])
    await content.unload()
  })

  it('keeps the conversation, so the second question has the first for context', async () => {
    const engine = stubEngine()
    const content = new ChatContent(engine)
    await content.load(host)
    await vi.waitFor(() => expect(input().disabled).toBe(false))

    await ask(content.getElement(), 'one')
    await ask(content.getElement(), 'two')

    const [, second] = (engine.reply as any).mock.calls
    const sent: Message[] = second[0]
    expect(sent[0].role).toBe('system')
    expect(sent.map((m) => m.content)).toContain('one')
    expect(sent.map((m) => m.content)).toContain('Hello.')
    await content.unload()
  })

  it('will not send an empty message', async () => {
    const engine = stubEngine()
    const content = new ChatContent(engine)
    await content.load(host)
    await vi.waitFor(() => expect(input().disabled).toBe(false))

    input().value = '   '
    host.querySelector<HTMLFormElement>('.chat-form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )

    expect(engine.reply).not.toHaveBeenCalled()
    await content.unload()
  })

  it('locks the box while it is answering, and gives it back after', async () => {
    let finish: (() => void) | undefined
    const engine = stubEngine({
      reply: vi.fn(
        (_m: Message[], onToken: (t: string) => void) =>
          new Promise<string>((resolve) => {
            finish = () => {
              onToken('done')
              resolve('done')
            }
          }),
      ) as ChatEngine['reply'],
    })
    const content = new ChatContent(engine)
    await content.load(host)
    await vi.waitFor(() => expect(input().disabled).toBe(false))

    input().value = 'slow one'
    host.querySelector<HTMLFormElement>('.chat-form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )

    await vi.waitFor(() => expect(send().disabled).toBe(true))
    expect(status().textContent).toContain('Thinking')

    finish!()
    await vi.waitFor(() => expect(input().disabled).toBe(false))
    await content.unload()
  })

  // Better said at the top than discovered at the third question.
  it('says what it is before anybody types', async () => {
    const content = new ChatContent(stubEngine())
    await content.load(host)

    const note = host.querySelector('.chat-note')!.textContent!
    expect(note).toContain('135M')
    expect(note).toContain('nothing is sent anywhere')
    expect(note).toContain('makes things up')
    await content.unload()
  })

  it('explains itself when the model will not load at all', async () => {
    const content = new ChatContent(
      stubEngine({ load: vi.fn().mockRejectedValue(new Error('no')) }),
    )
    await content.load(host)

    await vi.waitFor(() =>
      expect(status().textContent).toContain('could not be loaded'),
    )
    // And the box stays shut rather than pretending it can answer.
    expect(input().disabled).toBe(true)
    await content.unload()
  })

  /*
   * Closing the window stops whatever it was writing — but the weights stay
   * loaded, because opening it again should not fetch a hundred megabytes for
   * a second time.
   */
  it('abandons the answer when the window closes, and keeps the model', async () => {
    const engine = stubEngine({
      reply: vi.fn(
        (_m: Message[], _onToken: unknown, signal?: AbortSignal) =>
          new Promise<string>((_resolve, reject) => {
            signal?.addEventListener('abort', () => reject(new Error('gone')))
          }),
      ) as ChatEngine['reply'],
    })
    const content = new ChatContent(engine)
    await content.load(host)
    await vi.waitFor(() => expect(input().disabled).toBe(false))

    input().value = 'a long one'
    host.querySelector<HTMLFormElement>('.chat-form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    await vi.waitFor(() => expect(send().disabled).toBe(true))

    await content.unload()
    expect(engine.dispose).not.toHaveBeenCalled()
  })
})
