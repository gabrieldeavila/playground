import type { Rng } from '../random'
import { CLEAR_START, LANES, TAXI_SHARE } from './constants'
import type { Car, Lane } from './types'

// Espalha os carros de cada faixa pela pista, com espaçamento parecido e um pouco de sorteio.
export function createTraffic(trackLength: number, rng: Rng): Car[] {
  const cars: Car[] = []
  for (const lane of LANES) cars.push(...laneCars(lane, trackLength, rng, cars.length))
  return cars
}

function laneCars(lane: Lane, trackLength: number, rng: Rng, firstId: number): Car[] {
  const room = trackLength - CLEAR_START
  const spacing = room / lane.cars
  return Array.from({ length: lane.cars }, (_, i) => ({
    id: firstId + i,
    kind: rng() < TAXI_SHARE ? 'taxi' : 'sedan',
    s: CLEAR_START + (i + 0.2 + rng() * 0.6) * spacing,
    x: lane.x,
    speed: lane.speed,
    direction: lane.direction,
  }))
}
