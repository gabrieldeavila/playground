import { firstPropIndex } from './find-prop'
import type { Prop, Track } from './types'

// Props com s em (from, to]: o que ficou para trás entre dois quadros.
export function propsPassed(track: Track, from: number, to: number): Prop[] {
  const props = track.props
  const found: Prop[] = []
  for (let i = firstPropIndex(props, (p) => p.s <= from); i < props.length && props[i].s <= to; i++) found.push(props[i])
  return found
}
