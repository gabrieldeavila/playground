import type { Rng } from '../random'
import { SEGMENT_LENGTH } from './constants'
import type { Placement } from './place-prop'

// Árvore a `distance` metros do asfalto, num ponto qualquer do segmento.
export function randomTree(rng: Rng, side: -1 | 1, s: number, distance: number): Placement {
  return {
    kind: rng() < 0.55 ? 'pine' : 'tree',
    side,
    s: s + rng() * SEGMENT_LENGTH,
    distance,
    scale: 0.75 + rng() * 0.7,
    rotation: rng() * Math.PI * 2,
  }
}

// Maioria longe, poucas perto: o vale vai enchendo de mato para fora.
export const farTreeDistance = (rng: Rng) => 4 + rng() ** 1.7 * 60

// Faixa de árvores colada na pista: é o que passa rápido pelo canto do olho.
export const nearTreeDistance = (rng: Rng) => 2.5 + rng() * 4

export function randomRock(rng: Rng, side: -1 | 1, s: number): Placement {
  return {
    kind: 'rock',
    side,
    s: s + rng() * SEGMENT_LENGTH,
    distance: 3 + rng() * 25,
    scale: 0.6 + rng() * 1.2,
    rotation: rng() * Math.PI * 2,
  }
}
