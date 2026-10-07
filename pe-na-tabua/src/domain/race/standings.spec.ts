import { describe, expect, it } from 'vitest'
import { createTrack } from '../track/create-track'
import { SERRA } from '../track/courses/serra'
import { createRace } from './create-race'
import { ROSTER } from './roster'
import { placeOf, standings } from './standings'

describe('standings', () => {
  const race = createRace(createTrack(SERRA), ROSTER, 1)

  it('quem chegou vem antes, por tempo; o resto por distância', () => {
    race.riders.forEach((r, i) => (r.s = 1000 + i * 10))
    race.riders[0].finishTime = 90
    race.riders[1].finishTime = 85
    const order = standings(race).map((r) => r.id)
    expect(order.slice(0, 2)).toEqual([1, 0])
    expect(order[2]).toBe(race.riders.length - 1)
  })

  it('placeOf conta a partir de 1', () => {
    expect(placeOf(race, 1)).toBe(1)
  })
})
