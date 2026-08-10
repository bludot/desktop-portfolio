import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import ChatContent from '../src/contents/chat'
import {
  CHAT_MODEL,
  CHAT_MODELS,
  setChatEngine,
  type ChatEngine,
  type ChatModel,
  type Message,
  type Progress,
} from '@thatcatdev/browser-ai'
import { FEATURE_FLAG_DEFAULTS, loadSettings } from '../src/Store'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

/** A model that answers instantly, in pieces, without fetching anything. */
const stubEngine = (over: Partial<ChatEngine> = {}): ChatEngine => ({
  device: 'wasm',
  model: 'stub/model',
  fellBackToCpu: false,
  load: vi.fn().mockResolvedValue(undefined),
  reply: vi.fn(async (_messages: Message[], onToken: (t: string) => void) => {
    onToken('Hel')
    onToken('lo.')
    return 'Hello.'
  }),
  dispose: vi.fn(),
  ...over,
})

/**
 * A load that can be advanced from the test, in bytes.
 *
 * Bytes rather than a fraction because that is what the window is given and
 * what it has to reason about: the runtime counts only the files it has met, so
 * the total grows underneath the download. See `chat/progress`.
 */
const staged = (total = 800_000_000) => {
  let report: ((loaded: number, total: number) => void) | undefined
  let settle: (() => void) | undefined
  const engine = stubEngine({
    load: vi.fn(
      (onProgress?: Progress) =>
        new Promise<void>((resolve) => {
          settle = resolve
          report = (loaded, of) => {
            const fraction = of ? Math.min(1, loaded / of) : 0
            onProgress?.(fraction, { loaded, total: of, fraction })
          }
        }),
    ) as ChatEngine['load'],
  })
  return {
    engine,
    /** Say how many bytes have arrived, and of how many known. */
    to: (loaded: number, of: number = total) => report!(loaded, of),
    /** And the model is up — which is its own wait, after the last byte. */
    ready: () => {
      report!(total, total)
      settle!()
    },
  }
}

const input = () => host.querySelector<HTMLTextAreaElement>('.chat-input')!
const send = () => host.querySelector<HTMLButtonElement>('.chat-send')!
const status = () => host.querySelector<HTMLElement>('.chat-status')!
const bar = () => host.querySelector<HTMLElement>('.chat-progress')!
const fill = () => host.querySelector<HTMLElement>('.chat-progress-fill')!
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
    const content = new ChatContent(() => engine)

    // Built, but not mounted: nothing has been asked of the model yet.
    expect(engine.load).not.toHaveBeenCalled()

    await content.load(host)
    await vi.waitFor(() => expect(engine.load).toHaveBeenCalled())
    await content.unload()
  })

  // Hundreds of megabytes is a wait somebody should be able to watch, so the
  // window opens straight away and says how far along it is.
  it('opens immediately and counts the download in', async () => {
    const { engine, to, ready } = staged()
    const content = new ChatContent(() => engine)
    await content.load(host)

    await vi.waitFor(() => expect(status().textContent).toContain('Downloading'))
    to(336_000_000)
    expect(status().textContent).toContain('42%')

    // Nothing can be typed until there is something to answer with.
    expect(input().disabled).toBe(true)

    ready()
    await vi.waitFor(() => expect(input().disabled).toBe(false))
    await content.unload()
  })

  it('says when the GPU was asked for and could not be given', async () => {
    const content = new ChatContent(() =>
      stubEngine({ device: 'wasm', fellBackToCpu: true }),
    )
    await content.load(host)

    await vi.waitFor(() => expect(status().textContent).toContain('no WebGPU'))
    await content.unload()
  })

  /*
   * A percentage is a number to read; the bar is a thing to glance at. Somebody
   * deciding whether to sit through the better part of a gigabyte does the
   * second.
   */
  it('draws the download as a bar, and takes it away when there is nothing left to wait for', async () => {
    const { engine, to, ready } = staged()
    const content = new ChatContent(() => engine)
    await content.load(host)

    await vi.waitFor(() => expect(status().textContent).toContain('Downloading'))
    // Nothing counted yet: no length is honest, so it says only that something
    // is happening.
    expect(bar().hidden).toBe(false)
    expect(bar().classList.contains('is-waiting')).toBe(true)
    expect(bar().hasAttribute('aria-valuenow')).toBe(false)

    to(336_000_000)
    expect(bar().classList.contains('is-waiting')).toBe(false)
    expect(fill().style.width).toBe('42%')
    expect(bar().getAttribute('aria-valuenow')).toBe('42')

    ready()
    await vi.waitFor(() => expect(input().disabled).toBe(false))
    // A finished bar is just a line.
    expect(bar().hidden).toBe(true)
    await content.unload()
  })

  /*
   * The one that was actually wrong. The runtime counts only the files it has
   * met, and it meets the tokenizer first — so its own fraction reads 98%
   * before a byte of the model has arrived, and then sits there for minutes.
   * Measured against what the model weighs, seven megabytes is seven
   * megabytes.
   */
  it('measures against the model, not against the files it has met so far', async () => {
    const { engine, to } = staged()
    const content = new ChatContent(() => engine)
    await content.load(host)
    await vi.waitFor(() => expect(status().textContent).toContain('Downloading'))

    // The tokenizer, complete, and nothing else known about yet.
    to(7_000_000, 7_000_000)
    expect(fill().style.width).toBe('1%')
    expect(status().textContent).not.toContain('Building')

    // And now the weights are announced.
    to(7_000_000, 800_000_000)
    expect(fill().style.width).toBe('1%')
    await content.unload()
  })

  // A bar of no width is indistinguishable from a broken one, and the first
  // files of any of these downloads are too small to move it.
  it('keeps the bar travelling until there is a percent to show', async () => {
    const { engine, to } = staged()
    const content = new ChatContent(() => engine)
    await content.load(host)
    await vi.waitFor(() => expect(status().textContent).toContain('Downloading'))

    to(2_000_000)
    expect(bar().classList.contains('is-waiting')).toBe(true)
    expect(bar().getAttribute('aria-valuenow')).toBe('0')

    to(40_000_000)
    expect(bar().classList.contains('is-waiting')).toBe(false)
    expect(fill().style.width).toBe('5%')
    await content.unload()
  })

  /*
   * Between the last byte and the first answer the graph still has to be
   * built, and on a CPU that is seconds with nothing to report. A bar at 100%
   * and no explanation is where somebody decides the page is broken.
   */
  it('says what it is doing after the last byte', async () => {
    const { engine, to } = staged()
    const content = new ChatContent(() => engine)
    await content.load(host)
    await vi.waitFor(() => expect(status().textContent).toContain('Downloading'))

    to(799_000_000)
    expect(status().textContent).toContain('Downloading')

    to(800_000_000)
    expect(status().textContent).toContain('Building the model')
    expect(bar().classList.contains('is-preparing')).toBe(true)
    await content.unload()
  })

  it('leaves the bar behind when the model will not load at all', async () => {
    const content = new ChatContent(() =>
      stubEngine({ load: vi.fn().mockRejectedValue(new Error('no')) }),
    )
    await content.load(host)

    await vi.waitFor(() => expect(status().textContent).toContain('could not be loaded'))
    expect(bar().hidden).toBe(true)
    await content.unload()
  })

  it('answers, a token at a time', async () => {
    const engine = stubEngine()
    const content = new ChatContent(() => engine)
    await content.load(host)
    await vi.waitFor(() => expect(input().disabled).toBe(false))

    await ask(content.getElement(), 'hello there')

    expect(turns()).toEqual([
      { who: 'You', said: 'hello there' },
      { who: 'Model', said: 'Hello.' },
    ])
    await content.unload()
  })

  /*
   * The prompt still rules the capability out — it helps at the margin — but it
   * is not what is relied on: at this size an instruction is a suggestion, and
   * questions about searching or about today never reach the model at all. See
   * `ai/capability` and its tests.
   */
  it('carries the constraints in the prompt, for everything that does reach it', async () => {
    const engine = stubEngine()
    const content = new ChatContent(() => engine)
    await content.load(host)
    await vi.waitFor(() => expect(input().disabled).toBe(false))
    await ask(content.getElement(), 'explain what a monolith is')

    const [sent] = (engine.reply as any).mock.calls[0]
    const system: string = sent[0].content
    expect(sent[0].role).toBe('system')
    expect(system).toContain('cannot browse the web')
    expect(system).toContain('never offer to search')
    await content.unload()
  })

  it('keeps the conversation, so the second question has the first for context', async () => {
    const engine = stubEngine()
    const content = new ChatContent(() => engine)
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
    const content = new ChatContent(() => engine)
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
    const content = new ChatContent(() => engine)
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

  /*
   * The caveats used to be a four-clause mono strip welded across the top of
   * the window, read once and then furniture forever. They are one press away
   * now — but they are still the first thing under the only affordance in the
   * band, and they say more than the strip did.
   */
  it('keeps what it cannot do one press away, in plain sentences', async () => {
    const content = new ChatContent(() => stubEngine())
    await content.load(host)

    const band = host.querySelector<HTMLDetailsElement>('.chat-band')!
    expect(band.querySelector('summary')!.textContent).toContain('what is this?')
    // Closed to begin with: the window is for a conversation.
    expect(band.open).toBe(false)

    const said = [...band.querySelectorAll('.chat-what p')].map((p) => p.textContent!)
    expect(said).toHaveLength(3)
    expect(said.join(' ')).toContain('nothing you type leaves this tab')
    expect(said.join(' ')).toContain("can't look anything up")
    expect(said.join(' ')).toContain('invents things')
    await content.unload()
  })

  // The claim a visitor cannot check and would most like to know, as a state
  // rather than an argument.
  it('says it is private in the band itself', async () => {
    const content = new ChatContent(() => stubEngine())
    await content.load(host)
    expect(host.querySelector('.chat-private')!.textContent).toBe('private')
    await content.unload()
  })

  /*
   * The model's real name rather than "0.5B parameters" — it is searchable, and
   * it is what somebody would tell a friend they had been using.
   */
  it('names the model and the device once it is ready', async () => {
    const content = new ChatContent(() => stubEngine({ device: 'webgpu' }))
    await content.load(host)

    await vi.waitFor(() => expect(status().textContent).toContain('GPU'))
    expect(status().textContent).toContain('Qwen2.5')
    expect(host.querySelector('.chat-pip')!.classList.contains('is-ready')).toBe(true)
    await content.unload()
  })

  it('explains itself when the model will not load at all', async () => {
    const content = new ChatContent(() => stubEngine({ load: vi.fn().mockRejectedValue(new Error('no')) }))
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
   * loaded, because opening it again should not fetch several hundred megabytes for
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
    const content = new ChatContent(() => engine)
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

/*
 * Two choices on the window rather than in Settings, because both are things
 * somebody wants to change while looking at the answers.
 */
describe('choosing the model and where it runs', () => {
  it('offers three rungs, smallest first, each with its price on it', () => {
    expect(CHAT_MODELS.map((m: ChatModel) => m.label)).toEqual([
      'SmolLM2 135M',
      'Qwen2.5 0.5B',
      'Llama 3.2 1B',
    ])
    CHAT_MODELS.forEach((model: ChatModel) => expect(model.size).toMatch(/(MB|GB)$/))
  })

  /*
   * The size is not decoration: it is the number somebody decides on, and the
   * denominator the bar is drawn against. Both of these were wrong — the
   * default was advertised at 350MB and is nearer 800 — because they were
   * guessed from the parameter count rather than measured, and four-bit
   * quantisation leaves a 150,000-token embedding table at full precision.
   */
  it('carries the size in bytes too, agreeing with what it says in words', () => {
    CHAT_MODELS.forEach((model: ChatModel) => {
      expect(model.bytes).toBeGreaterThan(0)
      const said = Number(model.size.replace(/[^\d.]/g, ''))
      const stated = model.size.endsWith('GB') ? said * 1e9 : said * 1e6
      expect(model.bytes).toBeCloseTo(stated, -7)
    })
  })

  /*
   * The one that answers the question it was asked, rather than the one that
   * arrives fastest — and named outright rather than picked out by position,
   * so that reordering the rungs cannot quietly change what a visitor gets.
   * It is the expensive choice and a deliberate one: 800MB, chosen because
   * 135M parameters writes a scene instead of an answer.
   */
  it('defaults to Qwen2.5 0.5B', () => {
    expect(CHAT_MODEL).toBe('onnx-community/Qwen2.5-0.5B-Instruct')
    expect(CHAT_MODELS.find((m: ChatModel) => m.id === CHAT_MODEL)?.label).toBe(
      'Qwen2.5 0.5B',
    )
  })

  it('draws a picker, set to what is loaded', async () => {
    const content = new ChatContent()
    await content.load(host)

    const models = host.querySelector<HTMLSelectElement>('[aria-label="Model"]')!
    const devices = host.querySelector<HTMLSelectElement>('[aria-label="Runs on"]')!
    expect(models.value).toBe(CHAT_MODEL)
    expect(devices.value).toBe('auto')
    expect([...models.options].map((o) => o.value)).toEqual(
      CHAT_MODELS.map((m: ChatModel) => m.id),
    )
    await content.unload()
  })

  /*
   * Offered but not selectable, rather than left out: saying why beats letting
   * somebody wonder whether their machine could have done it.
   */
  it('shows the GPU as unavailable rather than hiding it', async () => {
    const content = new ChatContent()
    await content.load(host)

    const gpu = host.querySelector<HTMLOptionElement>('option[value="webgpu"]')!
    expect(gpu.disabled).toBe(true)
    expect(gpu.text).toContain('not available')
    await content.unload()
  })

  it('says when the GPU was asked for and could not be given', async () => {
    const content = new ChatContent(() =>
      stubEngine({ device: 'wasm', fellBackToCpu: true }),
    )
    await content.load(host)

    await vi.waitFor(() =>
      expect(status().textContent).toContain('no WebGPU'),
    )
    await content.unload()
  })

  // The point of switching model is usually to ask the same thing of a better
  // one; throwing the transcript away to prove a point about state is the wrong
  // answer to that.
  it('builds a new engine for the chosen model, keeping the conversation', async () => {
    const built: string[] = []
    const content = new ChatContent((model) => {
      built.push(model)
      return stubEngine({ model })
    })
    await content.load(host)
    await vi.waitFor(() => expect(input().disabled).toBe(false))
    await ask(content.getElement(), 'still here?')

    const models = host.querySelector<HTMLSelectElement>('[aria-label="Model"]')!
    models.value = CHAT_MODELS[0].id
    models.dispatchEvent(new Event('change'))
    await vi.waitFor(() => expect(built).toContain(CHAT_MODELS[0].id))

    // The transcript survives the swap: the point of changing model is usually
    // to ask the same thing of a better one.
    expect(turns().map((t) => t.said)).toContain('still here?')
    await content.unload()
  })

  it('remembers the choice for next time', async () => {
    const content = new ChatContent(() => stubEngine())
    await content.load(host)

    const devices = host.querySelector<HTMLSelectElement>('[aria-label="Runs on"]')!
    devices.value = 'wasm'
    devices.dispatchEvent(new Event('change'))

    await vi.waitFor(async () => {
      const saved = await loadSettings()
      expect(saved.chatDevice).toBe('wasm')
    })
    await content.unload()
  })
})
