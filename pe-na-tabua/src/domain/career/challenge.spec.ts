import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from '../race/rules'
import { CHALLENGE_STEPS, challengeAt, copLayout, rulesFor } from './challenge'

describe('challengeAt', () => {
  it('intensidade 1 é o jogo como foi afinado', () => {
    expect(challengeAt(1)).toEqual(CHALLENGE_STEPS[1])
    expect(copLayout(challengeAt(1).cops)).toEqual([0.3, 0.65])
    expect(rulesFor(challengeAt(1), { canBust: true, catchUp: 0 })).toEqual(DEFAULT_RULES)
  })

  it('no meio do caminho interpola, arredondando bots armados e policiais', () => {
    const half = challengeAt(0.5)
    expect(half.botPace).toBeCloseTo(-0.04)
    expect(half.bustTime).toBeCloseTo(1.4)
    expect(Number.isInteger(half.armedBots)).toBe(true)
    expect(Number.isInteger(half.cops)).toBe(true)
  })

  it('cada ponto inteiro aperta mais que o anterior', () => {
    for (let i = 1; i < CHALLENGE_STEPS.length; i++) {
      const [easier, harder] = [challengeAt(i - 1), challengeAt(i)]
      expect(harder.botPace).toBeGreaterThan(easier.botPace)
      expect(harder.armedBots).toBeGreaterThan(easier.armedBots)
      expect(harder.cops).toBeGreaterThanOrEqual(easier.cops)
    }
  })

  it('fora da escala, fica nas pontas', () => {
    expect(challengeAt(-1)).toEqual(challengeAt(0))
    expect(challengeAt(99)).toEqual(challengeAt(CHALLENGE_STEPS.length - 1))
  })
})
