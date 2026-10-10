import type { Rng } from '../random'
import { JAYWALKERS_PER_KM, PEDESTRIANS_PER_CROSSWALK, SIDEWALK_X, WAIT_TIME, WALK_SPEED } from './constants'
import { type StreetSpan, between, countAround, spanKm } from './street-span'
import type { Pedestrian } from './types'

const CROSSWALK_SPREAD = 3 // m: espalhados ao longo da faixa pintada

// Alguns pedestres em cada faixa, e uns apressados atravessando fora dela.
export function placePedestrians(span: StreetSpan, crosswalks: number[], rng: Rng, scale: number): Pedestrian[] {
  const spots: number[] = []
  for (const s of crosswalks) {
    const count = countAround(rng, PEDESTRIANS_PER_CROSSWALK * scale)
    for (let i = 0; i < count; i++) spots.push(s + (rng() - 0.5) * CROSSWALK_SPREAD)
  }
  const jaywalkers = countAround(rng, spanKm(span) * JAYWALKERS_PER_KM * scale)
  for (let i = 0; i < jaywalkers; i++) spots.push(span.from + rng() * (span.to - span.from))
  return spots.map((s, id) => waitingAt(id, s, rng))
}

function waitingAt(id: number, s: number, rng: Rng): Pedestrian {
  const side = rng() < 0.5 ? -1 : 1
  return {
    id,
    s,
    x: side * SIDEWALK_X,
    side,
    walkSpeed: between(rng, WALK_SPEED),
    state: 'waiting',
    timer: rng() * WAIT_TIME[1], // cada um sai numa hora
    flight: null,
  }
}
