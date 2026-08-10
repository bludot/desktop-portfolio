import { describe, it, expect } from 'vitest'
import {
  MADE_UP,
  SHOWN,
  SUGGESTIONS,
  parseQuestions,
  suggest,
} from '../src/contents/chat/suggestions'
import { aboutJames } from '../src/ai/documents'

describe('the questions on offer', () => {
  it('offers a few, in the order somebody meeting this would want them', () => {
    const next = suggest(new Set())
    expect(next).toHaveLength(SHOWN)
    expect(next[0]).toBe(SUGGESTIONS[0].text)
  })

  it('never offers one that has already been asked', () => {
    const asked = new Set([SUGGESTIONS[0].text, SUGGESTIONS[1].text])
    expect(suggest(asked)).not.toContain(SUGGESTIONS[0].text)
    expect(suggest(asked)).not.toContain(SUGGESTIONS[1].text)
  })

  it('runs out rather than repeating itself', () => {
    expect(suggest(new Set(SUGGESTIONS.map((s) => s.text)))).toEqual([])
  })

  /*
   * The follow-ups under an answer about GoTu should be about GoTu. It is the
   * difference between a conversation and a menu that happens to be printed
   * under one.
   */
  it('digs into whatever the last answer was about', () => {
    const next = suggest(new Set(['What does James do?']), [
      'Engineering Manager at GoTu',
    ])
    expect(next).toContain('What did he do at GoTu?')
    expect(next).toContain('How did he move GoTu off its monolith?')
  })

  /*
   * The model's follow-ups are about the answer that was just given, which no
   * fixed list can be — but never the whole row, so one bad turn cannot empty
   * it of questions somebody thought about.
   */
  it('puts the model\'s own follow-ups first, and keeps a written one', () => {
    const next = suggest(new Set(), [], SHOWN, [
      'What did he automate with Terraform?',
      'Who did he build the on-call program with?',
      'What else?',
    ])
    expect(next.slice(0, MADE_UP)).toEqual([
      'What did he automate with Terraform?',
      'Who did he build the on-call program with?',
    ])
    expect(next).toHaveLength(SHOWN)
    expect(SUGGESTIONS.map((s) => s.text)).toContain(next[SHOWN - 1])
  })

  it('will not offer a made-up question that has already been asked', () => {
    const made = ['What did he automate with Terraform?']
    expect(suggest(new Set(made), [], SHOWN, made)).not.toContain(made[0])
  })

  /*
   * The one that matters for the written list. A suggested question that comes
   * back "I don't have anything about that" is worse than no suggestion at
   * all, so every one of them has to name something the notes contain. (The
   * model's own are held to the same standard at runtime, by putting them
   * through retrieval before they are offered — see `answerable`.)
   */
  it('only names things the notes actually contain', () => {
    const notes = aboutJames()
      .map((passage) => passage.text)
      .join(' ')
      .toLowerCase()

    SUGGESTIONS.forEach((suggestion) => {
      // Every proper noun it names — a company, a language, a tool — dropping
      // the word that only starts the sentence.
      const named = suggestion.text
        .split(/\s+/)
        .slice(1)
        .filter((word) => /^[A-Z]/.test(word))
        .map((word) => word.replace(/[^\w]/g, '').toLowerCase())

      named.forEach((subject) => {
        expect(
          notes.includes(subject),
          `"${suggestion.text}" asks about "${subject}", which is in no passage`,
        ).toBe(true)
      })
    })
  })
})

/*
 * Asked for two questions, a small model will sometimes write three, number
 * them, quote them, or introduce them — "Here are some questions you might
 * ask:". Nothing is trusted except lines that end in a question mark.
 */
describe('reading what the model wrote back', () => {
  it('takes the questions and leaves the decoration', () => {
    expect(
      parseQuestions(
        [
          'Here are two questions you might ask:',
          '1. What did he automate with Terraform?',
          '- "Who did he build the on-call program with?"',
        ].join('\n'),
      ),
    ).toEqual([
      'What did he automate with Terraform?',
      'Who did he build the on-call program with?',
    ])
  })

  it('keeps no more than it was asked for', () => {
    const many = [
      'What did he build?',
      'Where did he work?',
      'Which languages does he use?',
    ].join('\n')
    expect(parseQuestions(many)).toHaveLength(MADE_UP)
  })

  it('refuses fragments, essays, and anything that is not a question', () => {
    const written = [
      'James is an engineer.',
      'Why?',
      'What did he do at GoTu, and how did the platform change as a result of the work his team owned over those years?',
      'What did he do at GoTu?',
    ].join('\n')
    expect(parseQuestions(written)).toEqual(['What did he do at GoTu?'])
  })

  it('says nothing when it was given nothing', () => {
    expect(parseQuestions('')).toEqual([])
    expect(parseQuestions('I cannot help with that.')).toEqual([])
  })
})
