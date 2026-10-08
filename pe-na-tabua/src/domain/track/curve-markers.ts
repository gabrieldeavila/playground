import { SEGMENT_LENGTH } from './constants'
import { placeProp } from './place-prop'
import type { Prop, Segment } from './types'

const SIGN_EVERY = 5
const SIGN_MIN_CURVE = 0.007
const RAIL_MIN_CURVE = 0.006
const RAIL_DISTANCE = 0.9 // logo depois da zebra

// No lado de fora das curvas: guard-rail contínuo e placas de seta.
export function placeCurveMarkers(props: Prop[], segment: Segment): void {
  const curve = Math.abs(segment.curve)
  const outer = segment.curve > 0 ? -1 : 1
  const s = segment.index * SEGMENT_LENGTH
  if (curve >= RAIL_MIN_CURVE) {
    // Um lance por segmento, centrado nele.
    placeProp(props, segment, { kind: 'rail', side: outer, s: s + SEGMENT_LENGTH / 2, distance: RAIL_DISTANCE, scale: 1, rotation: 0 })
  }
  if (curve >= SIGN_MIN_CURVE && segment.index % SIGN_EVERY === 0) {
    placeProp(props, segment, { kind: 'sign', side: outer, s, distance: 2.4, scale: 1, rotation: 0 })
  }
}
