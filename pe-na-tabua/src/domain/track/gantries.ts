import { SEGMENT_LENGTH } from './constants'
import type { Prop, Segment } from './types'

const GANTRY_EVERY = 60 // segmentos (~240 m)
const GANTRY_MAX_CURVE = 0.003
const FIRST_GANTRY = 30

// Pórticos de placas por cima da pista nas retas: passar por baixo dá noção de velocidade.
export function placeGantries(segments: Segment[]): Prop[] {
  return segments
    .filter((seg) => seg.index >= FIRST_GANTRY && seg.index % GANTRY_EVERY === 0 && Math.abs(seg.curve) < GANTRY_MAX_CURVE)
    .map((seg) => ({ kind: 'gantry', s: seg.index * SEGMENT_LENGTH, x: 0, scale: 1, rotation: 0 }))
}
