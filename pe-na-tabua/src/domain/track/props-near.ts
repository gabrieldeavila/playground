import { firstPropIndex } from './find-prop'
import type { Prop, Track } from './types'

// Props com s dentro de [s - range, s + range].
export function propsNear(track: Track, s: number, range: number): Prop[] {
  const props = track.props
  const found: Prop[] = []
  for (let i = firstPropIndex(props, (p) => p.s < s - range); i < props.length && props[i].s <= s + range; i++) found.push(props[i])
  return found
}
