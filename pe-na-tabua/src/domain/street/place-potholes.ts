import type { Rng } from '../random'
import { POTHOLE_RADIUS, POTHOLE_SPREAD, POTHOLES_PER_KM } from './constants'
import { type StreetSpan, between, countAround, spanKm } from './street-span'
import type { Pothole } from './types'

// Buracos espalhados por todo o asfalto, ordenados por s.
export function placePotholes(span: StreetSpan, rng: Rng, scale: number): Pothole[] {
  const count = countAround(rng, spanKm(span) * POTHOLES_PER_KM * scale)
  return Array.from({ length: count }, () => ({
    s: span.from + rng() * (span.to - span.from),
    x: (rng() * 2 - 1) * POTHOLE_SPREAD,
    radius: between(rng, POTHOLE_RADIUS),
  })).sort((a, b) => a.s - b.s)
}
