import type { Rng } from '../random'
import { buildingAt, lampAt } from './city-props'
import { SEGMENT_LENGTH } from './constants'
import { placeCurveMarkers } from './curve-markers'
import { placeGantries } from './gantries'
import { placeProp } from './place-prop'
import type { Placement } from './place-prop'
import type { Prop, Scenery, Segment } from './types'
import { farTreeDistance, nearTreeDistance, randomRock, randomTree } from './vegetation'

const POST_EVERY = 4 // um par de balizas a cada 16 m
const SHORE = 6 // m do asfalto: do lado do mar, nada mais longe que isso (estaria na água)

// Espalha árvores, pedras, balizas, placas, guard-rails e pórticos ao longo da pista.
// Na cidade, postes de luz e prédios no lugar das balizas.
export function scatterProps(segments: Segment[], rng: Rng, scenery: Scenery): Prop[] {
  const props: Prop[] = []
  for (const segment of segments) {
    if (segment.index < 3) continue
    const s = segment.index * SEGMENT_LENGTH
    for (const side of [-1, 1] as const) {
      const place = (p: Placement) => (side === scenery.seaSide && p.distance > SHORE ? null : placeProp(props, segment, p))
      if (scenery.urban) placeCityRow(place, rng, segment.index, side)
      else if (segment.index % POST_EVERY === 0) place({ kind: 'post', side, s, distance: 1.4, scale: 1, rotation: 0 })
      if (rng() < scenery.treeChance) place(randomTree(rng, side, s, farTreeDistance(rng), scenery.pineShare))
      if (rng() < scenery.nearTreeChance) place(randomTree(rng, side, s, nearTreeDistance(rng), scenery.pineShare))
      if (rng() < scenery.rockChance) place(randomRock(rng, side, s))
    }
    placeCurveMarkers(props, segment)
  }
  props.push(...placeGantries(segments))
  return props.sort((a, b) => a.s - b.s)
}

function placeCityRow(place: (p: Placement) => void, rng: Rng, segmentIndex: number, side: -1 | 1): void {
  const lamp = lampAt(segmentIndex, side)
  if (lamp) place(lamp)
  const building = buildingAt(rng, segmentIndex, side)
  if (building) place(building)
}
