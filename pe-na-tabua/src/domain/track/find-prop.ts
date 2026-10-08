import type { Prop } from './types'

// Busca binária nos props (ordenados por s): primeiro índice em que `before` deixa de valer.
export function firstPropIndex(props: Prop[], before: (prop: Prop) => boolean): number {
  let lo = 0
  let hi = props.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (before(props[mid])) lo = mid + 1
    else hi = mid
  }
  return lo
}
