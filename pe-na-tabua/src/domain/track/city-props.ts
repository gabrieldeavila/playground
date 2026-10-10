import type { Rng } from '../random'
import { RIDE_LIMIT, ROAD_HALF_WIDTH, SEGMENT_LENGTH } from './constants'
import type { Placement } from './place-prop'
import type { PropKind } from './types'

const LAMP_EVERY = 6 // segmentos (~24 m)
const LAMP_DISTANCE = 1.4 // como as balizas: quem raspa no guard-rail não bate no poste
const BUILDING_EVERY = 4 // segmentos (~16 m): a frente de um prédio
const BUILDING_CHANCE = 0.85 // o resto vira vão entre prédios
// Fachada um pouco além de onde a moto consegue ir: o prédio é a parede da rua.
const SETBACK = RIDE_LIMIT - ROAD_HALF_WIDTH + 0.5

// Meia profundidade de cada prédio (m, escala 1), para a fachada ficar alinhada.
export const BUILDING_HALF_DEPTH: Partial<Record<PropKind, number>> = { block: 6, tower: 6, shop: 5 }

// Os modelos têm a frente virada para -x: do lado esquerdo da pista, giram meia volta.
const facingRoad = (side: -1 | 1) => (side === 1 ? 0 : Math.PI)

// Poste de luz na beira da calçada, braço por cima do asfalto.
export function lampAt(segmentIndex: number, side: -1 | 1): Placement | null {
  if (segmentIndex % LAMP_EVERY !== 0) return null
  return { kind: 'lamp', side, s: segmentIndex * SEGMENT_LENGTH, distance: LAMP_DISTANCE, scale: 1, rotation: facingRoad(side) }
}

// Fileira de prédios colados, com um vão de vez em quando.
export function buildingAt(rng: Rng, segmentIndex: number, side: -1 | 1): Placement | null {
  if (segmentIndex % BUILDING_EVERY !== 0 || rng() > BUILDING_CHANCE) return null
  const kind = pickBuilding(rng())
  const scale = 0.85 + rng() * 0.4
  return {
    kind,
    side,
    s: (segmentIndex + BUILDING_EVERY / 2) * SEGMENT_LENGTH,
    distance: SETBACK + BUILDING_HALF_DEPTH[kind]! * scale,
    scale,
    rotation: facingRoad(side),
  }
}

function pickBuilding(roll: number): PropKind {
  if (roll < 0.45) return 'block'
  return roll < 0.7 ? 'tower' : 'shop'
}
