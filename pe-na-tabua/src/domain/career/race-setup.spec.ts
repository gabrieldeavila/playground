import { describe, expect, it } from 'vitest'
import { POLICE, ROSTER } from '../race/roster'
import { DEFAULT_RULES } from '../race/rules'
import { courseSections, sectionsLength } from '../track/course-sections'
import { SERRA } from '../track/courses/serra'
import { CHALLENGE_STEPS } from './challenge'
import { type Difficulty, difficultyById } from './difficulty'
import { LEVELS } from './levels'
import { type RaceSetup, buildRaceSetup } from './race-setup'

const outlaw = difficultyById('outlaw')
const bots = (setup: RaceSetup) => setup.riders.filter((r) => r.ai && r.role !== 'cop')
const cops = (setup: RaceSetup) => setup.riders.filter((r) => r.role === 'cop')
const length = (setup: RaceSetup) => sectionsLength(courseSections(setup.course))
const meanPace = (setup: RaceSetup) => bots(setup).reduce((sum, b) => sum + b.ai!.pace, 0) / bots(setup).length
const at = (intensity: number): Difficulty => ({ ...outlaw, intensity: LEVELS.map(() => intensity) })

describe('buildRaceSetup', () => {
  it('Outlaw nível 1 é o jogo de hoje: mesma pista, mesmos pilotos, mesmo trânsito, mesmas regras', () => {
    const setup = buildRaceSetup(SERRA, LEVELS[0], outlaw)
    expect(setup.course).toEqual(SERRA)
    expect(setup.riders).toEqual([...ROSTER, ...POLICE])
    expect(setup.trafficScale).toBe(1)
    expect(setup.rules).toEqual(DEFAULT_RULES)
  })

  it('cada nível do Outlaw é mais longo, com bots mais rápidos e mais policiais', () => {
    const setups = LEVELS.map((level) => buildRaceSetup(SERRA, level, outlaw))
    for (let i = 1; i < setups.length; i++) {
      expect(length(setups[i])).toBeGreaterThan(length(setups[i - 1]))
      expect(meanPace(setups[i])).toBeGreaterThan(meanPace(setups[i - 1]))
      expect(cops(setups[i]).length).toBeGreaterThanOrEqual(cops(setups[i - 1]).length)
      expect(setups[i].course.seed).not.toBe(setups[i - 1].course.seed)
    }
  })

  it('o mesmo nível tem a mesma pista em qualquer modo; só a corrida muda', () => {
    const joyride = buildRaceSetup(SERRA, LEVELS[2], difficultyById('joyride'))
    const hard = buildRaceSetup(SERRA, LEVELS[2], outlaw)
    expect(joyride.course).toEqual(hard.course)
    expect(meanPace(joyride)).toBeLessThan(meanPace(hard))
    expect(joyride.rules).toMatchObject({ canBust: false })
    expect(joyride.rules.catchUp).toBeGreaterThan(0)
  })

  it('pace e agressividade ficam entre 0 e 1', () => {
    for (const intensity of [0, CHALLENGE_STEPS.length - 1]) {
      for (const bot of bots(buildRaceSetup(SERRA, LEVELS[0], at(intensity)))) {
        expect(bot.ai!.pace).toBeGreaterThanOrEqual(0)
        expect(bot.ai!.pace).toBeLessThanOrEqual(1)
        expect(bot.ai!.aggression).toBeGreaterThanOrEqual(0)
        expect(bot.ai!.aggression).toBeLessThanOrEqual(1)
      }
    }
  })

  it('arma os bots mais agressivos, mantendo a arma que eles já tinham', () => {
    const armed = (intensity: number) => bots(buildRaceSetup(SERRA, LEVELS[0], at(intensity))).filter((b) => b.weapon)
    expect(armed(0)).toEqual([])
    expect(armed(2).map((b) => b.name)).toEqual(['Viper', 'Dutch', 'Lola', 'Brick'])
    expect(armed(2).find((b) => b.name === 'Brick')!.weapon).toBe('club')
  })

  it('o jogador continua de mãos vazias e no mesmo lugar do grid', () => {
    const setup = buildRaceSetup(SERRA, LEVELS[4], outlaw)
    const index = ROSTER.findIndex((r) => r.ai === null)
    expect(setup.riders[index]).toEqual(ROSTER[index])
  })

  it('pista mais longa ganha mais carros: a densidade só muda pela dificuldade', () => {
    const setup = buildRaceSetup(SERRA, LEVELS[2], outlaw)
    const ratio = length(setup) / sectionsLength(courseSections(SERRA))
    expect(setup.trafficScale).toBeCloseTo(CHALLENGE_STEPS[3].traffic * ratio)
  })
})
