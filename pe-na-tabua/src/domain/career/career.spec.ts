import { describe, expect, it } from 'vitest'
import { type Career, NEW_CAREER, courseAfter, courseToRace, recordResult } from './career'
import { difficultyById } from './difficulty'
import { LEVELS } from './levels'

const ONE = ['Serra']
const TWO = ['Serra', 'Litoral']
const outlaw = difficultyById('outlaw')
const record = (career: Career, level: number, course: string, place: number | null, courses = ONE) =>
  recordResult(career, { level, course, place }, courses, outlaw)

describe('recordResult', () => {
  it('passar no nível atual libera o próximo', () => {
    const { career, verdict } = record(NEW_CAREER, 1, 'Serra', 3)
    expect(career).toEqual({ level: 2, cleared: [], champion: false })
    expect(verdict).toMatchObject({ qualified: true, unlocked: 2, champion: false })
  })

  it('chegar fora do top 3 ou ser preso não muda nada', () => {
    expect(record(NEW_CAREER, 1, 'Serra', 4)).toEqual({
      career: NEW_CAREER,
      verdict: { level: 1, qualifyPlace: 3, qualified: false, unlocked: null, champion: false, coursesLeft: null },
    })
    expect(record(NEW_CAREER, 1, 'Serra', null).verdict.qualified).toBe(false)
  })

  it('nível anterior é treino: passa, mas a carreira não anda', () => {
    const career: Career = { level: 3, cleared: [], champion: false }
    const result = record(career, 1, 'Serra', 1)
    expect(result.career).toBe(career)
    expect(result.verdict).toMatchObject({ qualified: true, unlocked: null })
  })

  it('com várias pistas, só libera depois de passar em todas', () => {
    const first = record(NEW_CAREER, 1, 'Serra', 2, TWO)
    expect(first.career).toEqual({ level: 1, cleared: ['Serra'], champion: false })
    expect(first.verdict.unlocked).toBeNull()
    const again = record(first.career, 1, 'Serra', 1, TWO)
    expect(again.career.cleared).toEqual(['Serra'])
    expect(record(first.career, 1, 'Litoral', 3, TWO).career.level).toBe(2)
  })

  it('passar no último nível vira campeão', () => {
    const last: Career = { level: LEVELS.length, cleared: [], champion: false }
    const { career, verdict } = record(last, LEVELS.length, 'Serra', 1)
    expect(career).toMatchObject({ level: LEVELS.length, champion: true })
    expect(verdict).toMatchObject({ champion: true, unlocked: null })
    expect(record(career, LEVELS.length, 'Serra', 1).verdict.champion).toBe(false)
  })
})

describe('courseToRace', () => {
  it('no nível atual, a primeira pista que falta; nos outros, a primeira', () => {
    const career: Career = { level: 2, cleared: ['Serra'], champion: false }
    expect(courseToRace(career, 2, TWO)).toBe('Litoral')
    expect(courseToRace(career, 1, TWO)).toBe('Serra')
    expect(courseToRace(NEW_CAREER, 1, ONE)).toBe('Serra')
  })
})

describe('qualificação por modo', () => {
  it('no Joyride, chegar em 5º já passa', () => {
    const joyride = difficultyById('joyride')
    const { verdict } = recordResult(NEW_CAREER, { level: 1, course: 'Serra', place: 5 }, ONE, joyride)
    expect(verdict).toMatchObject({ qualified: true, qualifyPlace: 5, unlocked: 2 })
  })
})

describe('courseAfter', () => {
  const career: Career = { level: 2, cleared: ['Serra'], champion: false }

  it('não passou: repete a mesma pista', () => {
    expect(courseAfter(career, 2, 'Litoral', false, TWO)).toBe('Litoral')
  })

  it('passou no nível atual: a próxima que falta', () => {
    expect(courseAfter(career, 2, 'Serra', true, TWO)).toBe('Litoral')
    expect(courseAfter({ level: 3, cleared: [], champion: false }, 3, 'Litoral', true, TWO)).toBe('Serra')
  })

  it('treino: a próxima da lista, dando a volta', () => {
    expect(courseAfter(career, 1, 'Serra', true, TWO)).toBe('Litoral')
    expect(courseAfter(career, 1, 'Litoral', true, TWO)).toBe('Serra')
  })
})

describe('pistas que faltam', () => {
  it('conta quantas faltam no nível', () => {
    expect(record(NEW_CAREER, 1, 'Serra', 1, TWO).verdict.coursesLeft).toBe(1)
    expect(record(NEW_CAREER, 1, 'Serra', 9, TWO).verdict.coursesLeft).toBeNull()
  })
})
