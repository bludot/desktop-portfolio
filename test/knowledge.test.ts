import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import {
  aboutJames,
  asksForSources,
  fromRepos,
  knowledgeIndex,
  personal,
  refuse,
} from '../src/ai'
import { contextual, ground, setEmbedder, type Embedder } from '@thatcatdev/browser-ai'
import ChatContent from '../src/contents/chat'
import type { ChatEngine, Message } from '@thatcatdev/browser-ai'
import db from '../src/Store'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

const repo = (over: Record<string, unknown> = {}) =>
  ({
    name: 'ep',
    owner: 'ThatCatDev',
    description: 'events with Kafka',
    language: 'Go',
    ...over,
  }) as any

/** Vectors we control: one axis per topic, so retrieval is predictable. */
const fakeEmbedder = (topics: Record<string, string[]>): Embedder => {
  const axes = Object.keys(topics)
  const vector = (text: string) => {
    const lower = text.toLowerCase()
    const values = axes.map((a) => (topics[a].some((w) => lower.includes(w)) ? 1 : 0))
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

describe('what this desktop knows about James', () => {
  /*
   * A role in one passage averages out into a vector about nothing in
   * particular: asked what he did at GoTu, retrieval preferred the short
   * "senior software engineer" line from About — tighter on the question, and
   * ignorant of GoTu.
   */
  it('splits a role into a header and a passage per piece of work', () => {
    const roles = aboutJames().filter((d) => d.id.startsWith('role:'))
    expect(roles.length).toBeGreaterThan(20)
    expect(roles[0].text).toContain('James worked as')

    // Every fragment carries the employer, or it is unattributable.
    const gotu = roles.filter((d) => d.source.includes('GoTu'))
    expect(gotu.length).toBeGreaterThan(3)
    gotu.forEach((d) => expect(d.text).toContain('GoTu'))
  })

  // Eighty-eight one-line passages would crowd the roles out of retrieval on
  // any query naming a language.
  it('bundles repositories by owner rather than one passage each', () => {
    const bundles = aboutJames([
      repo({ name: 'ep' }),
      repo({ name: 'anime-api', owner: 'weeb-vip', description: 'anime catalogue' }),
      repo({ name: 'anime-sync', owner: 'weeb-vip', description: 'sync' }),
    ]).filter((d) => d.id.startsWith('repos:'))

    expect(bundles).toHaveLength(2)
    expect(bundles.find((d) => d.id === 'repos:weeb-vip')!.text).toContain('anime-api')
  })

  it('says nothing about repositories it does not have', () => {
    expect(aboutJames().some((d) => d.id.startsWith('repos:'))).toBe(false)
  })

  // The launcher searches repositories one at a time, since it is ranking rows
  // rather than assembling a paragraph.
  it('gives the launcher one document per repository', () => {
    const docs = fromRepos([repo({ name: 'key-management-service' })])
    expect(docs).toHaveLength(1)
    expect(docs[0].id).toBe('ThatCatDev/key-management-service')
    // The name is read as words, since that is how it was meant.
    expect(docs[0].text).toContain('key management service')
  })
})

describe('retrieving them', () => {
  const model = () =>
    fakeEmbedder({
      kafka: ['kafka', 'events', 'queue'],
      manage: ['engineering manager', 'gotu'],
      anime: ['anime'],
    })

  it('finds the passage a question is about', async () => {
    setEmbedder(model())
    const index = knowledgeIndex()
    await index.build(aboutJames())

    const found = await index.search('what has he done with kafka')
    expect(found.length).toBeGreaterThan(0)
    expect(found[0].document.text.toLowerCase()).toContain('kafka')
  })

  /*
   * Sentence embeddings are weak on proper nouns, so the desktop's index gives
   * the query's own uncommon words a nudge — without which a question naming an
   * employer scored no better against that employer than against any other.
   */
  it('prefers the employer that was actually named', async () => {
    setEmbedder(model())
    const index = knowledgeIndex()
    await index.build(aboutJames())

    const found = await index.search('what did James do at GoTu?')
    expect(found[0].document.source).toContain('GoTu')
  })

  it('offers nothing for a question it has no notes on', async () => {
    setEmbedder(model())
    const index = knowledgeIndex()
    await index.build(aboutJames())
    expect(await index.search('what is the capital of Peru')).toEqual([])
  })
})

/*
 * Three failures from one conversation, each fixed here:
 *
 *   "what about weaknesses?"  → retrieved the strengths notes again, and the
 *                               model invented soft criticism to fit
 *   "what is that based on?"  → treated as a question about James, so the same
 *                               notes came back and it repeated itself
 */
describe('a conversation rather than a series of questions', () => {
  it('searches a short follow-up with the question before it', () => {
    expect(contextual('what about weaknesses?', 'what are his best qualities?'))
      .toBe('what are his best qualities? what about weaknesses?')
  })

  it('says outright when there is nothing on a question about him', () => {
    const asked = ground('what are his weaknesses?', [], { whenEmpty: 'say-unknown' })
    expect(asked).toContain('There are no notes about this')
  })

  it('knows which questions are about him at all', () => {
    expect(personal('what does he do?')).toBe(true)
    expect(personal('what is a monolith?')).toBe(false)
  })

  /*
   * Retrieval can never answer this one: asked for weaknesses it returns the
   * *strengths* passages, because that is what the question is about. A CV does
   * not record faults, so the answer is about the source rather than the man.
   */
  it('refuses what the notes do not record by construction', () => {
    ;['what about weaknesses?', 'what is he bad at', 'his flaws?', 'what does he earn'].forEach(
      (q) => expect(refuse(q)?.answer, q).toContain("don't record"),
    )
    expect(refuse('what about weaknesses?')?.search).toBeUndefined()
    expect(refuse('what are his strengths?')).toBeUndefined()
  })

  // The library decides whether to refuse; the desktop chooses the words.
  it('speaks in the desktop’s own voice about what it cannot do', () => {
    expect(refuse('can you search the web?')?.answer).toContain("can't search")
    expect(refuse('can you search the web?')?.search).toBe('can you search the web?')
    expect(refuse('whats airing today?')?.answer).toContain('present')
    expect(refuse('what day is it?')?.answer).toContain('no clock')
    expect(refuse('what day is it?')?.search).toBeUndefined()
  })

  it('recognises somebody asking where an answer came from', () => {
    ;['what is that based on?', 'where did you get that', 'how do you know?'].forEach((q) =>
      expect(asksForSources(q), q).toBe(true),
    )
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

  it('answers where the last one came from, rather than retrieving again', async () => {
    const engine = stub()
    const content = new ChatContent(() => engine)
    await content.load(host)
    await vi.waitFor(() =>
      expect(host.querySelector<HTMLTextAreaElement>('.chat-input')!.disabled).toBe(false),
    )

    await ask('what is that based on?')

    // The model is never asked a question about the conversation.
    expect(engine.reply).not.toHaveBeenCalled()
    const said = [...host.querySelectorAll('.chat-said')].pop()!.textContent!
    expect(said).toContain('no notes')
    await content.unload()
  })
})
