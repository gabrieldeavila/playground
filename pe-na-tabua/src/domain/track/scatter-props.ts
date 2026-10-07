import type { Rng } from '../random'
import { ROAD_HALF_WIDTH, SEGMENT_LENGTH } from './constants'
import type { Prop, PropKind, Segment } from './types'

const POST_EVERY = 10
const SIGN_EVERY = 5
const SIGN_MIN_CURVE = 0.007
const TREE_CHANCE = 0.3
const ROCK_CHANCE = 0.035

interface Placement {
  kind: PropKind
  side: -1 | 1
  s: number
  distance: number // do canto do asfalto para fora (m)
  scale: number
  rotation: number
}

// Espalha árvores, pedras, balizas e placas ao longo da pista.
export function scatterProps(segments: Segment[], rng: Rng): Prop[] {
  const props: Prop[] = []
  for (const segment of segments) {
    if (segment.index < 3) continue
    const s = segment.index * SEGMENT_LENGTH
    for (const side of [-1, 1] as const) {
      if (segment.index % POST_EVERY === 0) place(props, segment, { kind: 'post', side, s, distance: 1.4, scale: 1, rotation: 0 })
      if (rng() < TREE_CHANCE) place(props, segment, randomTree(rng, side, s))
      if (rng() < ROCK_CHANCE) place(props, segment, randomRock(rng, side, s))
    }
    if (Math.abs(segment.curve) >= SIGN_MIN_CURVE && segment.index % SIGN_EVERY === 0) {
      const outer = segment.curve > 0 ? -1 : 1
      place(props, segment, { kind: 'sign', side: outer, s, distance: 2.4, scale: 1, rotation: 0 })
    }
  }
  return props.sort((a, b) => a.s - b.s)
}

function randomTree(rng: Rng, side: -1 | 1, s: number): Placement {
  return {
    kind: rng() < 0.55 ? 'pine' : 'tree',
    side,
    s: s + rng() * SEGMENT_LENGTH,
    distance: 4 + rng() ** 1.7 * 60,
    scale: 0.75 + rng() * 0.7,
    rotation: rng() * Math.PI * 2,
  }
}

function randomRock(rng: Rng, side: -1 | 1, s: number): Placement {
  return {
    kind: 'rock',
    side,
    s: s + rng() * SEGMENT_LENGTH,
    distance: 3 + rng() * 25,
    scale: 0.6 + rng() * 1.2,
    rotation: rng() * Math.PI * 2,
  }
}

function place(props: Prop[], segment: Segment, p: Placement): void {
  if (!fitsInsideCurve(segment.curve, p.side, p.distance)) return
  props.push({ kind: p.kind, s: p.s, x: p.side * (ROAD_HALF_WIDTH + p.distance), scale: p.scale, rotation: p.rotation })
}

// No lado de dentro de uma curva fechada não cabe nada muito longe da pista.
function fitsInsideCurve(curve: number, side: -1 | 1, distance: number): boolean {
  if (Math.abs(curve) < 1e-4 || Math.sign(curve) !== side) return true
  return ROAD_HALF_WIDTH + distance < 0.75 / Math.abs(curve)
}
