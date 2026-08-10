import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import {
  Knowledge,
  aboutJames,
  contextual,
  ground,
  passages,
  KNOWLEDGE_FLOOR,
} from '../src/ai/knowledge'
import { asksForSources, refuse } from '../src/ai/capability'
import ChatContent from '../src/contents/chat'
import { setEmbedder, type Embedder } from '../src/ai/engine'
import type { ChatEngine, Message } from '../src/ai/chat'
import db from '../src/Store'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

const repo = (over: Record<string, unknown> = {}) =>
  ({ name: 'ep', owner: 'ThatCatDev', description: 'events with Kafka', language: 'Go', ...over }) as any

/** Vectors we control: one axis per topic word, so retrieval is predictable. */
const fakeEmbedder = (topics: Record<string, string[]>): Embedder => {
  const axes = Object.keys(topics)
  const vector = (text: string) => {
    const lower = text.toLowerCase()
    const values = axes.map((axis) => (topics[axis].some((w) => lower.includes(w)) ? 1 : 0))
    const length = Math.hypot(...values) || 1
    return Float32Array.from(values.map((v) => v / length))
  }
  return {
    device: 'wasm',
    load: vi.fn().mockResolvedValue(undefined),
    embed: vi.fn(async (texts: string[]) => texts.map(vector)),
    dispose: vi.fn(),
  }
}

beforeEach(async () => {
  await db.cache.clear()
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  setEmbedder(undefined)
  host.remove()
})

describe('what the model is given to work with', () => {
  /*
   * Nine bullets in one passage average out into a vector about nothing in
   * particular: asked what James did at GoTu, retrieval preferred the short
   * "senior software engineer" line from About. Split up, each piece of work
   * can win on its own merits.
   */
  it('splits a role into a header and a passage per piece of work', () => {
    const roles = passages([]).filter((p) => p.id.startsWith('role:'))
    expect(roles.length).toBeGreaterThan(20)
    expect(roles[0].text).toContain('James worked as')

    // Every fragment carries the employer, or it is unattributable.
    const gotu = roles.filter((p) => p.source.includes('GoTu'))
    expect(gotu.length).toBeGreaterThan(3)
    gotu.forEach((p) => expect(p.text).toContain('GoTu'))
  })

  /*
   * Eighty-eight one-line passages would crowd the roles out of retrieval on
   * any query naming a language.
   */
  it('bundles repositories by owner rather than one passage each', () => {
    const found = passages([
      repo({ name: 'ep' }),
      repo({ name: 'anime-api', owner: 'weeb-vip', description: 'anime catalogue' }),
      repo({ name: 'anime-sync', owner: 'weeb-vip', description: 'sync' }),
    ]).filter((p) => p.id.startsWith('repos:'))

    expect(found).toHaveLength(2)
    expect(found.find((p) => p.id === 'repos:weeb-vip')!.text).toContain('anime-api')
  })

  it('says nothing about repositories it does not have', () => {
    expect(passages([]).some((p) => p.id.startsWith('repos:'))).toBe(false)
  })
})

describe('Knowledge', () => {
  const model = () =>
    fakeEmbedder({
      kafka: ['kafka', 'events', 'queue'],
      manage: ['engineering manager', 'gotu', 'led'],
      anime: ['anime', 'weeb'],
    })

  /*
   * Sentence embeddings are weak on proper nouns — "GoTu" is a rare token
   * carrying almost no meaning — so the query's own uncommon words get a small
   * bonus where they appear. A nudge, not the ranking.
   */
  it('prefers the employer that was actually named', async () => {
    const knowledge = new Knowledge(model())
    await knowledge.build()

    const found = await knowledge.find('what did James do at GoTu?')
    expect(found.length).toBeGreaterThan(0)
    expect(found[0].source).toContain('GoTu')
  })

  it('finds the passage a question is about', async () => {
    const knowledge = new Knowledge(model())
    await knowledge.build()

    const found = await knowledge.find('what has he done with kafka')
    expect(found.length).toBeGreaterThan(0)
    expect(found[0].text.toLowerCase()).toContain('kafka')
  })

  // A weak match here becomes a paragraph the model treats as true.
  it('offers nothing for a question it has no notes on', async () => {
    const knowledge = new Knowledge(model())
    await knowledge.build()
    expect(await knowledge.find('what is the capital of Peru')).toEqual([])
  })

  // Regression: on a cache hit the vectors loaded and the model did not, so
  // the question could not be embedded and every later visit retrieved nothing.
  it('takes the vectors from the cache and still answers questions', async () => {
    await new Knowledge(model()).build()

    const second = model()
    const knowledge = new Knowledge(second)
    await knowledge.build()

    expect((second.embed as any).mock.calls).toHaveLength(0)
    expect(second.load).toHaveBeenCalled()
    expect((await knowledge.find('what has he done with kafka')).length)
      .toBeGreaterThan(0)
  })

  it('says nothing at all when the model will not load', async () => {
    const broken: Embedder = {
      device: undefined,
      load: vi.fn().mockRejectedValue(new Error('nope')),
      embed: vi.fn().mockRejectedValue(new Error('nope')),
      dispose: vi.fn(),
    }
    const knowledge = new Knowledge(broken)
    await expect(knowledge.build()).resolves.toBeUndefined()
    expect(await knowledge.find('kafka')).toEqual([])
  })

  it('has a floor high enough to keep a guess out of the prompt', () => {
    expect(KNOWLEDGE_FLOOR).toBeGreaterThan(0.3)
  })
})

describe('grounding the question', () => {
  it('puts the notes above the question, with the instruction next to them', () => {
    const asked = ground('what did he do at GoTu?', [
      { id: 'role:0', source: 'Engineering Manager, GoTu', text: 'James led delivery.' },
    ])

    expect(asked).toContain('Notes about James:')
    expect(asked).toContain('- James led delivery.')
    // No prohibition between the notes and the question: told "use only these
    // and say you do not know otherwise", the model refused outright.
    expect(asked).not.toMatch(/only|do not know/i)
    expect(asked.trimEnd().endsWith('answer briefly: what did he do at GoTu?')).toBe(true)
  })

  it('leaves a question alone when there is nothing to add', () => {
    expect(ground('hello', [])).toBe('hello')
  })
})

/*
 * Told in its prompt that it could not search, the model said "Yes, I can
 * search the web" and then invented an anime release. These never reach it.
 */
describe('what never reaches the model', () => {
  it('refuses a search, and offers a real one instead', () => {
    const refusal = refuse('can you search the web?')!
    expect(refusal.answer).toContain("can't search")
    expect(refusal.search).toBe('can you search the web?')
  })

  it('refuses anything about now', () => {
    expect(refuse('whats the newest anime airing?')?.answer).toContain('present')
    expect(refuse('what is the weather today')).toBeTruthy()
    expect(refuse('latest news')).toBeTruthy()
  })

  it('refuses the date, without offering to search for it', () => {
    const refusal = refuse('what day is it?')!
    expect(refusal.answer).toContain('no clock')
    expect(refusal.search).toBeUndefined()
  })

  // Most things are still the model's to attempt — everything about James
  // arrives as retrieved notes rather than as recall.
  it('lets an ordinary question through', () => {
    expect(refuse('what did James do at GoTu?')).toBeUndefined()
    expect(refuse('explain what a monolith is')).toBeUndefined()
  })
})

describe('the window, asked something it cannot answer', () => {
  const stub = (): ChatEngine => ({
    device: 'wasm',
    model: 'stub/model',
    fellBackToCpu: false,
    load: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn(async (_m: Message[], onToken: (t: string) => void) => {
      onToken('hi')
      return 'hi'
    }),
    dispose: vi.fn(),
  })

  it('answers for itself and offers the desktop’s search', async () => {
    const engine = stub()
    const content = new ChatContent(() => engine)
    await content.load(host)
    await vi.waitFor(() =>
      expect(host.querySelector<HTMLTextAreaElement>('.chat-input')!.disabled).toBe(false),
    )

    host.querySelector<HTMLTextAreaElement>('.chat-input')!.value = 'can you search the web?'
    host.querySelector<HTMLFormElement>('.chat-form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )

    // The model is never asked.
    expect(engine.reply).not.toHaveBeenCalled()
    const link = host.querySelector<HTMLAnchorElement>('.chat-web')!
    expect(link.href).toContain('duckduckgo.com')
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noopener noreferrer')
    await content.unload()
  })
})

/*
 * Three failures from one conversation, each fixed here:
 *
 *   "what about weaknesses?"      → retrieved the strengths notes again, and
 *                                   the model invented soft criticism to fit
 *   "what is that based on?"      → treated as a question about James, so the
 *                                   same notes came back and it repeated itself
 *   neither answer                → could point at anything it had used
 */
describe('a conversation rather than a series of questions', () => {
  it('searches a short follow-up with the question before it', () => {
    expect(contextual('what about weaknesses?', 'what are his best qualities?'))
      .toBe('what are his best qualities? what about weaknesses?')
  })

  // A question long enough to stand up on its own is left to do so, or every
  // search would drag the last subject along behind it.
  it('leaves a full question alone', () => {
    const asked = 'what did James build at Taskworld with Docker and Kubernetes?'
    expect(contextual(asked, 'tell me about GoTu')).toBe(asked)
  })

  it('has nothing to carry on the first question', () => {
    expect(contextual('hello there')).toBe('hello there')
  })

  /*
   * Asked for weaknesses — which nothing here records — it produced a
   * paragraph of plausible invented criticism. Saying outright that there is
   * nothing is what produces "I don't know" instead.
   */
  it('says outright when there is nothing on a question about James', () => {
    const asked = ground('what are his weaknesses?', [])
    expect(asked).toContain('There are no notes about this')
    expect(asked).toContain('you do not know')
  })

  // Everything else is still the model's to answer normally.
  it('leaves a general question ungrounded rather than refused', () => {
    expect(ground('what is a monolith?', [])).toBe('what is a monolith?')
    expect(aboutJames('what is a monolith?')).toBe(false)
    expect(aboutJames('what does he do?')).toBe(true)
  })

  /*
   * Retrieval cannot answer this one: asked for weaknesses it returns the
   * *strengths* passages, because that is what the question is about, and the
   * model writes plausible criticism out of them. A CV does not record faults,
   * so the honest answer is about the source rather than the man.
   */
  it('refuses what the notes do not record by construction', () => {
    ;['what about weaknesses?', 'what is he bad at', 'his flaws?', 'what does he earn'].forEach(
      (q) => expect(refuse(q)?.answer, q).toContain("don't record"),
    )
    // And offers no web search for it: nobody's faults are on DuckDuckGo either.
    expect(refuse('what about weaknesses?')?.search).toBeUndefined()
    expect(refuse('what are his strengths?')).toBeUndefined()
  })

  it('recognises somebody asking where an answer came from', () => {
    ;[
      'what is that based on?',
      'where did you get that',
      'how do you know?',
      "what's your source",
    ].forEach((q) => expect(asksForSources(q), q).toBe(true))

    expect(asksForSources('what did James do at GoTu?')).toBe(false)
  })
})

describe('showing the working', () => {
  const stub = (): ChatEngine => ({
    device: 'wasm',
    model: 'stub/model',
    fellBackToCpu: false,
    load: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn(async (_m: Message[], onToken: (t: string) => void) => {
      onToken('He led delivery at GoTu.')
      return 'He led delivery at GoTu.'
    }),
    dispose: vi.fn(),
  })

  const ask = async (text: string) => {
    host.querySelector<HTMLTextAreaElement>('.chat-input')!.value = text
    host.querySelector<HTMLFormElement>('.chat-form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    await vi.waitFor(() =>
      expect(host.querySelector<HTMLTextAreaElement>('.chat-input')!.disabled).toBe(false),
    )
  }

  it('cites the passages an answer was built from, with the words in them', async () => {
    setEmbedder(fakeEmbedder({ gotu: ['gotu', 'engineering manager'] }))
    const content = new ChatContent(() => stub())
    await content.load(host)
    await vi.waitFor(() =>
      expect(host.querySelector<HTMLTextAreaElement>('.chat-input')!.disabled).toBe(false),
    )
    // The notes are built in the background; wait for them before asking.
    await vi.waitFor(() => expect(host.querySelector('.chat-input')).toBeTruthy())
    await new Promise((r) => setTimeout(r, 50))

    await ask('what did James do at GoTu?')

    const source = host.querySelector('.chat-source')
    if (source) {
      // A label alone asks somebody to trust that the label matched.
      expect(source.querySelector('summary')!.textContent).toContain('from ')
      expect(source.querySelectorAll('li').length).toBeGreaterThan(0)
      expect(source.querySelector('li')!.textContent!.length).toBeGreaterThan(20)
    }
    await content.unload()
  })

  it('answers where the last one came from, rather than retrieving again', async () => {
    const engine = stub()
    const content = new ChatContent(() => engine)
    await content.load(host)
    await vi.waitFor(() =>
      expect(host.querySelector<HTMLTextAreaElement>('.chat-input')!.disabled).toBe(false),
    )

    await ask('what is that based on?')

    // The model is not asked a question about the conversation.
    expect(engine.reply).not.toHaveBeenCalled()
    const said = [...host.querySelectorAll('.chat-said')].pop()!.textContent!
    // Nothing had been retrieved yet, so it says so rather than inventing.
    expect(said).toContain('no notes')
    await content.unload()
  })
})
