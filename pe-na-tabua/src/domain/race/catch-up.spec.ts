import { describe, expect, it } from 'vitest'
import { SERRA } from '../track/courses/serra'
import { createTrack } from '../track/create-track'
import { catchUpBoost } from './catch-up'
import { createRace } from './create-race'
import { ROSTER } from './roster'
import { DEFAULT_RULES } from './rules'

const track = createTrack(SERRA)
const raceWith = (catchUp: number, gap: number) => {
  const race = createRace(track, ROSTER, 1, { rules: { ...DEFAULT_RULES, catchUp } })
  race.riders.forEach((r) => (r.s = 1000))
  race.riders[race.playerId].s = 1000 - gap
  return race
}

describe('catchUpBoost', () => {
  it('sem ajuda nas regras, nunca ajuda', () => {
    expect(catchUpBoost(raceWith(0, 500))).toBe(1)
  })

  it('perto do líder, nada; longe, a ajuda toda', () => {
    expect(catchUpBoost(raceWith(0.1, 20))).toBe(1)
    expect(catchUpBoost(raceWith(0.1, 120))).toBeCloseTo(1.05)
    expect(catchUpBoost(raceWith(0.1, 600))).toBeCloseTo(1.1)
  })
})
