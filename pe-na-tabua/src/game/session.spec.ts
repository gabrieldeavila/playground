import { describe, expect, it } from 'vitest'
import { type Career, NEW_CAREER, NEW_CAREERS } from '../domain/career/career'
import type { DifficultyId } from '../domain/career/difficulty'
import type { RiderInput } from '../domain/race/types'
import { NEW_SAVE } from '../data/parse-save'
import { Session } from './session'

const IDLE: RiderInput = { throttle: 0, brake: 0, steer: 0, punch: false, kick: false }
const saveWith = (difficulty: DifficultyId, career: Career) => ({ difficulty, careers: { ...NEW_CAREERS, [difficulty]: career } })

// Faz o jogador cruzar a chegada na posição `place` e espera a tela de resultado.
function finishAs(session: Session, place: number): void {
  const race = session.race
  const player = race.riders[race.playerId]
  const ahead = race.riders.filter((r) => r.role === 'racer' && r.id !== race.playerId).slice(0, place - 1)
  ahead.forEach((r, i) => (r.finishTime = i + 1))
  race.finishOrder = [...ahead.map((r) => r.id), player.id]
  player.finishTime = place
  player.s = race.track.finishS + 1
  race.phase = 'finished'
  for (let t = 0; t < 3 && session.mode === 'racing'; t += 0.1) session.step(IDLE, 0.1)
}

describe('Session', () => {
  it('começa no último modo jogado, no nível mais alto liberado dele', () => {
    const session = new Session(saveWith('outlaw', { level: 2, cleared: [], champion: false }))
    expect(session.difficulty.id).toBe('outlaw')
    expect(session.selected).toBe(2)
    expect(session.current.level.number).toBe(2)
  })

  it('na tela de níveis só escolhe entre os liberados', () => {
    const session = new Session(saveWith('racer', { level: 3, cleared: [], champion: false }))
    session.openLevels()
    session.select(5)
    expect(session.selected).toBe(3)
    session.select(-9)
    expect(session.selected).toBe(1)
  })

  it('na tela de modos as setas trocam o modo, e cada modo tem a sua carreira', () => {
    const session = new Session(saveWith('racer', { level: 4, cleared: [], champion: false }))
    session.openModes()
    session.select(1)
    expect(session.difficulty.id).toBe('outlaw')
    expect(session.selected).toBe(1)
    session.select(-2)
    expect(session.difficulty.id).toBe('joyride')
    session.select(-1)
    expect(session.difficulty.id).toBe('joyride')
    expect(session.save.difficulty).toBe('joyride')
  })

  it('passar numa pista leva para a outra; passar nas duas libera o próximo nível', () => {
    const session = new Session(NEW_SAVE)
    session.start()
    const levelOneTrack = session.race.track
    expect(session.course).toBe('Serra')
    finishAs(session, 2)
    expect(session.verdict).toMatchObject({ qualified: true, unlocked: null, coursesLeft: 1 })
    expect(session.course).toBe('Litoral')
    session.start()
    expect(session.race.track.theme).toBe('coast')
    finishAs(session, 1)
    expect(session.verdict).toMatchObject({ qualified: true, unlocked: 2 })
    expect(session.save.careers).toEqual({ ...NEW_CAREERS, racer: { level: 2, cleared: [], champion: false } })
    expect(session.course).toBe('Serra')
    session.start()
    expect(session.current.level.number).toBe(2)
    expect(session.race.track.length).toBeGreaterThan(levelOneTrack.length)
  })

  it('na tela de pistas abre na que falta e as setas trocam a pista', () => {
    const session = new Session(saveWith('racer', { level: 1, cleared: ['Serra'], champion: false }))
    session.openCourses()
    expect(session.course).toBe('Litoral')
    session.select(-1)
    expect(session.course).toBe('Serra')
    session.select(-1)
    expect(session.course).toBe('Serra')
  })

  it('não passar repete o mesmo nível', () => {
    const session = new Session(saveWith('outlaw', NEW_CAREER))
    session.start()
    finishAs(session, 5)
    expect(session.verdict).toMatchObject({ qualified: false, unlocked: null })
    expect(session.career).toEqual(NEW_CAREER)
    expect(session.selected).toBe(1)
  })

  it('a pista é a mesma em todos os modos; as regras não', () => {
    const session = new Session(saveWith('joyride', NEW_CAREER))
    session.start()
    const { track, rules } = session.race
    session.openModes()
    session.select(2)
    session.start()
    expect(session.race.track).toBe(track)
    expect(session.race.rules).not.toEqual(rules)
  })
})
