import type { Rng } from '../random'
import type { Track } from '../track/types'
import { CONE_SPACING, ROADWORK_LENGTH, ROADWORK_LINES, ROADWORKS_PER_KM } from './constants'
import { type StreetSpan, between, countAround, isStraight, spanKm } from './street-span'
import type { Cone } from './types'

const TRIES = 12
const CLEARANCE = 20 // m livres entre uma obra e uma faixa de pedestres ou outra obra

// Obras: fileiras de cones numa linha entre faixas, nas retas. `scale` = densidade do desafio.
export function placeRoadworks(track: Track, span: StreetSpan, crosswalks: number[], rng: Rng, scale: number): Cone[] {
  const taken: [number, number][] = crosswalks.map((s) => [s, s])
  const cones: Cone[] = []
  const count = countAround(rng, spanKm(span) * ROADWORKS_PER_KM * scale)
  for (let i = 0; i < count; i++) {
    const zone = findZone(track, span, taken, rng)
    if (!zone) continue
    taken.push(zone)
    const x = ROADWORK_LINES[Math.floor(rng() * ROADWORK_LINES.length)]
    for (let s = zone[0]; s <= zone[1]; s += CONE_SPACING) cones.push({ id: cones.length, s, x, flight: null })
  }
  return cones
}

function findZone(track: Track, span: StreetSpan, taken: [number, number][], rng: Rng): [number, number] | null {
  for (let i = 0; i < TRIES; i++) {
    const length = between(rng, ROADWORK_LENGTH)
    const from = span.from + rng() * (span.to - span.from - length)
    const to = from + length
    const free = taken.every(([a, b]) => to + CLEARANCE < a || from - CLEARANCE > b)
    if (free && isStraight(track, from, to)) return [from, to]
  }
  return null
}
