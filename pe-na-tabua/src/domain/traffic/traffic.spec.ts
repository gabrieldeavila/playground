import { describe, expect, it } from 'vitest'
import { createRng } from '../random'
import { CLEAR_START, LANES } from './constants'
import { createTraffic } from './create-traffic'
import { stepTraffic } from './step-traffic'

const LENGTH = 5000

describe('createTraffic', () => {
  const cars = createTraffic(LENGTH, createRng(3))

  it('enche todas as faixas e deixa a largada livre', () => {
    expect(cars).toHaveLength(LANES.reduce((sum, lane) => sum + lane.cars, 0))
    for (const lane of LANES) expect(cars.some((car) => car.x === lane.x)).toBe(true)
    expect(cars.every((car) => car.s >= CLEAR_START && car.s < LENGTH)).toBe(true)
  })

  it('tem táxis e carros comuns, com ids únicos', () => {
    expect(new Set(cars.map((car) => car.kind))).toEqual(new Set(['sedan', 'taxi']))
    expect(new Set(cars.map((car) => car.id)).size).toBe(cars.length)
  })

  it('escala multiplica os carros de cada faixa', () => {
    const dense = createTraffic(LENGTH, createRng(3), 1.5)
    for (const lane of LANES) expect(dense.filter((car) => car.x === lane.x)).toHaveLength(Math.round(lane.cars * 1.5))
    expect(dense.every((car) => car.s >= CLEAR_START && car.s < LENGTH)).toBe(true)
  })
})

describe('stepTraffic', () => {
  it('cada um anda no seu sentido e dá a volta nas pontas', () => {
    const forward = { id: 0, kind: 'sedan', s: LENGTH - 5, x: 1.6, speed: 20, direction: 1 } as const
    const oncoming = { id: 1, kind: 'taxi', s: 5, x: -1.6, speed: 20, direction: -1 } as const
    const cars = [{ ...forward }, { ...oncoming }]
    stepTraffic(cars, LENGTH, 0.5)
    expect(cars[0].s).toBeCloseTo(5)
    expect(cars[1].s).toBeCloseTo(LENGTH - 5)
  })
})
