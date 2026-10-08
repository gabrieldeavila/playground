import type { Rng } from '../random'
import { SEGMENT_LENGTH } from './constants'
import { placeCurveMarkers } from './curve-markers'
import { placeGantries } from './gantries'
import { placeProp } from './place-prop'
import type { Prop, Segment } from './types'
import { farTreeDistance, nearTreeDistance, randomRock, randomTree } from './vegetation'

const POST_EVERY = 4 // um par de balizas a cada 16 m
const TREE_CHANCE = 0.3
const NEAR_TREE_CHANCE = 0.12
const ROCK_CHANCE = 0.035

// Espalha árvores, pedras, balizas, placas, guard-rails e pórticos ao longo da pista.
export function scatterProps(segments: Segment[], rng: Rng): Prop[] {
  const props: Prop[] = []
  for (const segment of segments) {
    if (segment.index < 3) continue
    const s = segment.index * SEGMENT_LENGTH
    for (const side of [-1, 1] as const) {
      if (segment.index % POST_EVERY === 0) placeProp(props, segment, { kind: 'post', side, s, distance: 1.4, scale: 1, rotation: 0 })
      if (rng() < TREE_CHANCE) placeProp(props, segment, randomTree(rng, side, s, farTreeDistance(rng)))
      if (rng() < NEAR_TREE_CHANCE) placeProp(props, segment, randomTree(rng, side, s, nearTreeDistance(rng)))
      if (rng() < ROCK_CHANCE) placeProp(props, segment, randomRock(rng, side, s))
    }
    placeCurveMarkers(props, segment)
  }
  props.push(...placeGantries(segments))
  return props.sort((a, b) => a.s - b.s)
}
