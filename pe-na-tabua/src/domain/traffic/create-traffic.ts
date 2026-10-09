import type { Rng } from '../random'
import { CLEAR_START, LANES, TAXI_SHARE } from './constants'
import { nextLaneChange } from './lane-change'
import type { Car, Lane } from './types'

// Espalha os carros de cada faixa pela pista, com espaçamento parecido e um pouco de sorteio.
// `scale` multiplica quantos carros cada faixa tem.
export function createTraffic(trackLength: number, rng: Rng, scale = 1): Car[] {
  const cars: Car[] = []
  LANES.forEach((lane, index) => cars.push(...laneCars(lane, index, Math.round(lane.cars * scale), trackLength, rng, cars.length)))
  return cars
}

function laneCars(lane: Lane, index: number, count: number, trackLength: number, rng: Rng, firstId: number): Car[] {
  const room = trackLength - CLEAR_START
  const spacing = room / count
  return Array.from({ length: count }, (_, i) => ({
    id: firstId + i,
    kind: rng() < TAXI_SHARE ? 'taxi' : 'sedan',
    s: CLEAR_START + (i + 0.2 + rng() * 0.6) * spacing,
    x: lane.x,
    speed: lane.speed,
    direction: lane.direction,
    lane: index,
    change: null,
    changeTimer: nextLaneChange(rng),
  }))
}
