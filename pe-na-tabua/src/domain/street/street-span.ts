import { lerp } from '../math'
import type { Rng } from '../random'
import { SEGMENT_LENGTH } from '../track/constants'
import type { Track } from '../track/types'
import { HAZARD_FREE_FINISH, HAZARD_FREE_START, STRAIGHT_CURVE } from './constants'

// Trecho da pista onde a rua pode ter coisas: sem a largada e sem a chegada.
export interface StreetSpan {
  from: number
  to: number
}

export function streetSpan(track: Track): StreetSpan {
  return { from: HAZARD_FREE_START, to: track.finishS - HAZARD_FREE_FINISH }
}

export const spanKm = (span: StreetSpan) => Math.max(0, span.to - span.from) / 1000

export const between = (rng: Rng, [min, max]: [number, number]) => lerp(min, max, rng())

// Quantidade sorteada com média `mean`: a parte inteira, mais um com a chance da fração.
export const countAround = (rng: Rng, mean: number) => Math.floor(mean) + (rng() < mean % 1 ? 1 : 0)

// Pista quase reta entre `from` e `to`?
export function isStraight(track: Track, from: number, to: number): boolean {
  const first = Math.max(0, Math.floor(from / SEGMENT_LENGTH))
  const last = Math.min(track.segments.length - 1, Math.floor(to / SEGMENT_LENGTH))
  for (let i = first; i <= last; i++) if (Math.abs(track.segments[i].curve) >= STRAIGHT_CURVE) return false
  return true
}
