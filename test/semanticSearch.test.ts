import { describe, it, expect, vi } from 'vitest'
import { search } from '../src/components/Launcher/results'
import { FEATURE_FLAG_DEFAULTS } from '../src/Store'

/*
 * What is left here is the part that is this desktop's: how a match found by
 * meaning sits among the ones found by spelling. The index itself, the scoring,
 * the caching and the device negotiation are `@thatcatdev/browser-ai`'s, and
 * are tested there.
 */

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

const key = (r: { owner: string; name: string }) => `${r.owner}/${r.name}`

describe('where related results sit in the launcher', () => {
  const kafka = repo({ name: 'ep', description: 'events with Kafka' })
  const anime = repo({ name: 'anime-api', description: 'anime catalogue' })

  it('offers what the query is about, marked as such', () => {
    const results = search(
      'message queue',
      sources({ repos: [kafka, anime], related: new Map([[key(kafka), 0.61]]) }),
    )

    const projects = results.filter((r) => r.group === 'Projects')
    expect(projects.map((r) => r.name)).toEqual(['ep'])
    // A result matching nothing you typed reads as a bug unless it says why.
    expect(projects[0].badge).toBe('related')
  })

  // Somebody typing "anime" wants anime-api first, and no similarity score
  // improves on that.
  it('puts literal matches ahead of related ones', () => {
    const results = search(
      'anime',
      sources({ repos: [kafka, anime], related: new Map([[key(kafka), 0.44]]) }),
    )

    const projects = results.filter((r) => r.group === 'Projects')
    expect(projects.map((r) => r.name)).toEqual(['anime-api', 'ep'])
    expect(projects[0].badge).toBeUndefined()
  })

  it('never lists the same repository twice', () => {
    const results = search(
      'anime',
      sources({ repos: [anime], related: new Map([[key(anime), 0.9]]) }),
    )
    expect(results.filter((r) => r.group === 'Projects')).toHaveLength(1)
  })

  it('changes nothing at all when there are no related matches', () => {
    const withFlag = search('anime', sources({ repos: [kafka, anime], related: new Map() }))
    const without = search('anime', sources({ repos: [kafka, anime] }))
    expect(withFlag.map((r) => r.id)).toEqual(without.map((r) => r.id))
  })
})

describe('the flags', () => {
  // It gates something the launcher fetches on open, without being asked: a
  // visitor who landed here rather than chose to be should not be pulling down
  // weights to search a list they can already read. The chat window is the
  // other model on this desktop and is not a flag, because opening it is the
  // asking.
  it('ships off', () => {
    expect(FEATURE_FLAG_DEFAULTS.semanticSearch.enabled).toBe(false)
  })
})
