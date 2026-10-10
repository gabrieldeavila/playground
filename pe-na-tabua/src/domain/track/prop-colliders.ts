import { ROAD_HALF_WIDTH } from './constants'
import type { Prop, PropKind } from './types'

// Pilares do pórtico, a partir do centro da pista (m).
export const GANTRY_HALF_SPAN = ROAD_HALF_WIDTH + 1.2

interface Collider {
  offsets: number[] // partes sólidas, a partir do x do prop (m)
  radius: number
}

// Guard-rail não derruba: ele segura a moto na pista (race/rails.ts).
const COLLIDERS: Record<PropKind, Collider | null> = {
  tree: { offsets: [0], radius: 0.45 },
  pine: { offsets: [0], radius: 0.4 },
  rock: { offsets: [0], radius: 1.0 },
  post: { offsets: [0], radius: 0.2 },
  sign: { offsets: [0], radius: 0.3 },
  rail: null,
  gantry: { offsets: [-GANTRY_HALF_SPAN, GANTRY_HALF_SPAN], radius: 0.35 },
  lamp: { offsets: [0], radius: 0.2 },
  // Prédios ficam além de RIDE_LIMIT: a moto não chega neles.
  block: null,
  tower: null,
  shop: null,
}

// Algo sólido do prop está a menos de `margin` do deslocamento lateral `x`?
export function propBlocks(prop: Prop, x: number, margin: number): boolean {
  const collider = COLLIDERS[prop.kind]
  if (!collider) return false
  return collider.offsets.some((offset) => Math.abs(prop.x + offset - x) < collider.radius * prop.scale + margin)
}
