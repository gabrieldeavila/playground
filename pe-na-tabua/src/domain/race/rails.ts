import { SEGMENT_LENGTH } from '../track/constants'
import { propsNear } from '../track/props-near'
import type { Track } from '../track/types'
import { RAIL_BOUNCE, RAIL_DRAG, RIDER_RADIUS } from './constants'
import type { Rider } from './types'

// Quem já está do lado de fora do guard-rail (entrou por fora do asfalto) passa livre.
const BEHIND_RAIL = 1

// Guard-rail segura a moto na pista: ela encosta, raspa, perde velocidade e é devolvida.
export function scrapeRails(track: Track, rider: Rider, dt: number): void {
  rider.scraping = false
  const side = Math.sign(rider.x)
  const rail = propsNear(track, rider.s, SEGMENT_LENGTH / 2).find((p) => p.kind === 'rail' && Math.sign(p.x) === side)
  if (!rail) return
  const limit = Math.abs(rail.x) - RIDER_RADIUS
  const out = Math.abs(rider.x)
  if (out <= limit || out > Math.abs(rail.x) + BEHIND_RAIL) return
  rider.x = side * limit
  rider.pushVel = -side * RAIL_BOUNCE
  rider.speed = Math.max(0, rider.speed - RAIL_DRAG * dt)
  rider.scraping = rider.speed > 0
}
