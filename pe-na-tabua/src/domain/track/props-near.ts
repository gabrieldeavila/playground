import type { Prop, Track } from './types'

// Props ficam ordenados por s: busca binária pelo começo da janela.
export function propsNear(track: Track, s: number, range: number): Prop[] {
  const props = track.props
  let lo = 0
  let hi = props.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (props[mid].s < s - range) lo = mid + 1
    else hi = mid
  }
  const found: Prop[] = []
  for (let i = lo; i < props.length && props[i].s <= s + range; i++) found.push(props[i])
  return found
}
