import { describe, expect, it } from 'vitest'
import { MAX_SPEED } from '../domain/race/constants'
import { HEARING_RANGE, engineHz, impactGain, panFor, whooshGain, windGain } from './levels'

describe('levels', () => {
  it('motor a 6000 rpm explode 200 vezes por segundo', () => {
    expect(engineHz(6000)).toBe(200)
  })

  it('vento cresce com o quadrado da velocidade', () => {
    expect(windGain(MAX_SPEED / 2)).toBeCloseTo(windGain(MAX_SPEED) / 4)
    expect(windGain(0)).toBe(0)
  })

  it('vush é mais alto perto e some fora do alcance', () => {
    expect(whooshGain(MAX_SPEED, 1)).toBeGreaterThan(whooshGain(MAX_SPEED, 6))
    expect(whooshGain(MAX_SPEED, -HEARING_RANGE)).toBe(0)
    expect(whooshGain(0, 1)).toBe(0)
  })

  it('lado do som segue o lado do objeto', () => {
    expect(panFor(-20)).toBe(-1)
    expect(panFor(2)).toBeGreaterThan(0)
    expect(impactGain(100)).toBe(0)
  })
})
