import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { search } from '../src/components/Launcher/results'
import {
  RepoIndex,
  fingerprint,
  keyOf,
  sentence,
  SIMILARITY_FLOOR,
} from '../src/ai/repoIndex'
import { similarity, bestDevice, setEmbedder, type Embedder } from '../src/ai/engine'
import db from '../src/Store'
import { FEATURE_FLAG_DEFAULTS } from '../src/Store'

const repo = (over: Record<string, unknown> = {}) =>
  ({
    id: Math.floor(Math.random() * 1e6),
    name: 'thing',
    owner: 'bludot',
    description: 'does a thing',
    language: 'Go',
    stars: 0,
    url: 'https://github.com/bludot/thing',
    pushedAt: '2026-01-01T00:00:00Z',
    archived: false,
    homepage: undefined,
    ...over,
  }) as any

const sources = (over: Record<string, unknown> = {}) =>
  ({
    apps: [],
    windows: [],
    repos: [],
    actions: [],
    openApp: vi.fn(),
    showWindow: vi.fn(),
    openRepo: vi.fn(),
    copy: vi.fn(),
    searchWeb: vi.fn(),
    ...over,
  }) as any

/** An embedder with opinions we control: one axis per topic word. */
const fakeEmbedder = (topics: Record<string, string[]>): Embedder => {
  const axes = Object.keys(topics)
  const vector = (text: string) => {
    const lower = text.toLowerCase()
    const values = axes.map((axis) =>
      topics[axis].some((word) => lower.includes(word)) ? 1 : 0,
    )
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
})

afterEach(() => {
  setEmbedder(undefined)
})

describe('the engine', () => {
  it('picks WebGPU when the browser has it, and WASM when it does not', () => {
    const nav = navigator as unknown as Record<string, unknown>
    expect(bestDevice()).toBe('wasm')

    nav.gpu = {}
    expect(bestDevice()).toBe('webgpu')
    delete nav.gpu
  })

  // Everything is normalised on the way out of the model, so a dot product is
  // the cosine — dividing by two lengths of 1 is work for nothing.
  it('scores identical vectors at 1 and opposite ones at -1', () => {
    const a = Float32Array.from([1, 0, 0])
    const b = Float32Array.from([-1, 0, 0])
    expect(similarity(a, a)).toBeCloseTo(1)
    expect(similarity(a, b)).toBeCloseTo(-1)
    expect(similarity(a, Float32Array.from([0, 1, 0]))).toBeCloseTo(0)
  })
})

describe('what a repository is turned into', () => {
  it('reads its name as words, since that is how it was meant', () => {
    expect(sentence(repo({ name: 'key-management-service', description: 'auth' })))
      .toContain('key management service')
  })

  it('leaves out what is not there rather than leaving a gap', () => {
    expect(sentence(repo({ name: 'thing', language: null, description: null })))
      .toBe('thing')
  })

  // A renamed repository or a rewritten description has to rebuild the index,
  // or the launcher answers today's query from last month's corpus.
  it('changes its fingerprint when a description changes', () => {
    const before = fingerprint([repo({ name: 'a', description: 'one' })])
    const after = fingerprint([repo({ name: 'a', description: 'two' })])
    expect(before).not.toBe(after)
  })
})

describe('RepoIndex', () => {
  const corpus = [
    repo({ name: 'ep', description: 'events with Kafka, Pulsar, RabbitMQ' }),
    repo({ name: 'anime-api', description: 'anime catalogue service' }),
    repo({ name: 'terraform-modules', description: 'infrastructure as code' }),
  ]

  const model = () =>
    fakeEmbedder({
      queues: ['kafka', 'pulsar', 'rabbitmq', 'message queue', 'events'],
      anime: ['anime', 'weeb'],
      infra: ['terraform', 'infrastructure'],
    })

  it('finds what a query is about, with none of its letters', async () => {
    const index = new RepoIndex(model())
    await index.build(corpus)

    const matches = await index.search('message queue')
    expect(matches[0].key).toBe(keyOf(corpus[0]))
    expect(matches[0].score).toBeGreaterThan(SIMILARITY_FLOOR)
  })

  // Cosine similarity always has a best answer, however wrong. The floor is
  // what stops nonsense returning three confident results.
  it('answers nothing for a query about nothing', async () => {
    const index = new RepoIndex(model())
    await index.build(corpus)

    expect(await index.search('asdfghjkl')).toEqual([])
  })

  // Two letters are a prefix, not a topic, and the literal match answers those
  // better than any model does.
  it('leaves short queries to the literal matching', async () => {
    const index = new RepoIndex(model())
    await index.build(corpus)

    expect(await index.search('ka')).toEqual([])
  })

  it('embeds the corpus once and keeps the answer', async () => {
    const embedder = model()
    const index = new RepoIndex(embedder)

    await index.build(corpus)
    await index.build(corpus)

    // One call for the corpus; nothing more for a rebuild of the same thing.
    expect((embedder.embed as any).mock.calls).toHaveLength(1)
  })

  it('comes back from the cache rather than the model on a later visit', async () => {
    const first = model()
    await new RepoIndex(first).build(corpus)

    const second = model()
    const index = new RepoIndex(second)
    await index.build(corpus)

    expect(index.ready).toBe(true)
    // The weights were never brought in: the vectors were already stored.
    expect(second.load).not.toHaveBeenCalled()
  })

  it('rebuilds when the repositories have changed underneath it', async () => {
    const first = model()
    await new RepoIndex(first).build(corpus)

    const second = model()
    await new RepoIndex(second).build([
      ...corpus,
      repo({ name: 'new-thing', description: 'something else entirely' }),
    ])

    expect(second.load).toHaveBeenCalled()
  })

  /*
   * This is an improvement on a search box that already works. A model that
   * will not load has to leave the launcher exactly as it was.
   */
  it('stays empty and silent when the model will not load', async () => {
    const broken: Embedder = {
      device: undefined,
      load: vi.fn().mockRejectedValue(new Error('no WebGPU, no WASM, no luck')),
      embed: vi.fn(),
      dispose: vi.fn(),
    }
    const index = new RepoIndex(broken)

    await expect(index.build(corpus)).resolves.toBeUndefined()
    expect(index.ready).toBe(false)
    expect(await index.search('message queue')).toEqual([])
  })
})

describe('where related results sit in the launcher', () => {
  const kafka = repo({ name: 'ep', description: 'events with Kafka' })
  const anime = repo({ name: 'anime-api', description: 'anime catalogue' })

  it('offers what the query is about, marked as such', () => {
    const results = search(
      'message queue',
      sources({ repos: [kafka, anime], related: new Map([[keyOf(kafka), 0.61]]) }),
    )

    const projects = results.filter((r) => r.group === 'Projects')
    expect(projects.map((r) => r.name)).toEqual(['ep'])
    // A result that matches nothing you typed looks like a bug unless it says
    // why it is there.
    expect(projects[0].badge).toBe('related')
  })

  /*
   * Somebody typing "anime" wants anime-api first, and no similarity score
   * improves on that.
   */
  it('puts literal matches ahead of related ones', () => {
    const results = search(
      'anime',
      sources({ repos: [kafka, anime], related: new Map([[keyOf(kafka), 0.44]]) }),
    )

    const projects = results.filter((r) => r.group === 'Projects')
    expect(projects.map((r) => r.name)).toEqual(['anime-api', 'ep'])
    expect(projects[0].badge).toBeUndefined()
  })

  it('never lists the same repository twice', () => {
    const results = search(
      'anime',
      sources({ repos: [anime], related: new Map([[keyOf(anime), 0.9]]) }),
    )

    expect(results.filter((r) => r.group === 'Projects')).toHaveLength(1)
  })

  it('changes nothing at all when there are no related matches', () => {
    const withFlag = search('anime', sources({ repos: [kafka, anime], related: new Map() }))
    const without = search('anime', sources({ repos: [kafka, anime] }))
    expect(withFlag.map((r) => r.id)).toEqual(without.map((r) => r.id))
  })
})

describe('the flag', () => {
  // Off for a visitor who landed here rather than chose to be: it is the one
  // thing on this desktop that fetches a model.
  it('ships off', () => {
    expect(FEATURE_FLAG_DEFAULTS.semanticSearch.enabled).toBe(false)
  })
})
