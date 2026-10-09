import { describe, expect, it } from 'vitest'
import { NEW_CAREER, type Verdict } from '../domain/career/career'
import { DIFFICULTIES, difficultyById } from '../domain/career/difficulty'
import { LEVELS } from '../domain/career/levels'
import { COURSES } from '../domain/track/courses/courses'
import { courseRows } from './course-rows'
import { levelRows } from './level-rows'
import { modeRows } from './mode-rows'
import { verdictText } from './verdict-text'

const verdict = (overrides: Partial<Verdict>): Verdict => ({
  level: 1,
  qualifyPlace: 3,
  qualified: false,
  unlocked: null,
  champion: false,
  coursesLeft: null,
  ...overrides,
})

describe('verdictText', () => {
  it('fora do top 3: diz o que faltou e oferece tentar de novo', () => {
    expect(verdictText(verdict({}), false)).toEqual({
      headline: 'NOT QUALIFIED',
      detail: 'Finish top 3 to clear level 1',
      cta: 'ENTER try again · L levels',
    })
    expect(verdictText(verdict({}), true).headline).toBe('BUSTED!')
  })

  it('passou, mas falta pista no nível: Enter vai para a próxima', () => {
    expect(verdictText(verdict({ qualified: true, coursesLeft: 1 }), false)).toEqual({
      headline: 'QUALIFIED',
      detail: '1 more course to clear level 1',
      cta: 'ENTER next course · L levels',
    })
  })

  it('liberou nível: Enter já vai para ele', () => {
    expect(verdictText(verdict({ qualified: true, unlocked: 2, coursesLeft: 0 }), false)).toMatchObject({
      detail: 'Level 2 unlocked',
      cta: 'ENTER level 2 · L levels',
    })
  })

  it('passou no último nível: campeão', () => {
    expect(verdictText(verdict({ level: 5, qualified: true, champion: true }), false).headline).toBe('CHAMPION!')
  })
})

describe('levelRows', () => {
  const outlaw = difficultyById('outlaw')

  it('liberados até o nível atual, com quantas pistas já passou nele', () => {
    const rows = levelRows({ level: 2, cleared: ['Serra'], champion: false }, LEVELS, 2, outlaw)
    expect(rows.map((r) => r.state)).toEqual(['cleared', 'next', 'locked', 'locked', 'locked'])
    expect(rows[1]).toMatchObject({ cops: 2, qualifyPlace: 3, progress: '1/2' })
    expect(rows[0].progress).toBe('')
  })

  it('campeão: tudo passado', () => {
    const rows = levelRows({ ...NEW_CAREER, level: 5, champion: true }, LEVELS, 2, outlaw)
    expect(rows.every((r) => r.state === 'cleared')).toBe(true)
  })

  it('Joyride: um policial e top 5 em todo nível', () => {
    const rows = levelRows(NEW_CAREER, LEVELS, 2, difficultyById('joyride'))
    expect(rows.every((r) => r.cops === 1 && r.qualifyPlace === 5)).toBe(true)
  })
})

describe('courseRows', () => {
  it('tamanho da pista no nível e quais já passou', () => {
    const career = { level: 2, cleared: ['Litoral'], champion: false }
    const [serra, litoral] = courseRows(career, LEVELS[1], COURSES)
    expect(serra).toMatchObject({ name: 'Serra', cleared: false })
    expect(litoral).toMatchObject({ name: 'Litoral', cleared: true })
    expect(Number(serra.km)).toBeGreaterThan(Number(courseRows(career, LEVELS[0], COURSES)[0].km))
    expect(courseRows(career, LEVELS[0], COURSES).every((r) => r.cleared)).toBe(true)
  })

  it('Serra no nível 1 tem 5,4 km', () => {
    expect(courseRows(NEW_CAREER, LEVELS[0], COURSES)[0].km).toBe('5.4')
  })
})

describe('modeRows', () => {
  it('mostra o quanto cada carreira andou', () => {
    const careers = { joyride: NEW_CAREER, racer: { level: 3, cleared: [], champion: false }, outlaw: { level: 5, cleared: [], champion: true } }
    expect(modeRows(DIFFICULTIES, careers, 5).map((r) => r.progress)).toEqual(['New', 'Level 3 of 5', 'Champion'])
  })
})
