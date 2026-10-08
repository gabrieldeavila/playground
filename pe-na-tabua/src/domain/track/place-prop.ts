import { ROAD_HALF_WIDTH } from './constants'
import type { Prop, PropKind, Segment } from './types'

export interface Placement {
  kind: PropKind
  side: -1 | 1
  s: number
  distance: number // do canto do asfalto para fora (m)
  scale: number
  rotation: number
}

// Põe o prop na lista se ele couber naquele lado da curva.
export function placeProp(props: Prop[], segment: Segment, p: Placement): void {
  if (!fitsInsideCurve(segment.curve, p.side, p.distance)) return
  props.push({ kind: p.kind, s: p.s, x: p.side * (ROAD_HALF_WIDTH + p.distance), scale: p.scale, rotation: p.rotation })
}

// No lado de dentro de uma curva fechada não cabe nada muito longe da pista.
function fitsInsideCurve(curve: number, side: -1 | 1, distance: number): boolean {
  if (Math.abs(curve) < 1e-4 || Math.sign(curve) !== side) return true
  return ROAD_HALF_WIDTH + distance < 0.75 / Math.abs(curve)
}
