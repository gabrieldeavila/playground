import type { Rng } from '../random'
import type { Track } from '../track/types'
import { CROSSWALK_EVERY } from './constants'
import { type StreetSpan, isStraight } from './street-span'

const HALF_WIDTH = 4 // m de faixa pintada ao longo da pista, para cada lado
const SKIP = 20 // m: numa curva, tenta de novo um pouco mais à frente

// Faixas de pedestres nas retas, mais ou menos a cada CROSSWALK_EVERY metros.
export function placeCrosswalks(track: Track, span: StreetSpan, rng: Rng): number[] {
  const crosswalks: number[] = []
  let s = span.from + rng() * CROSSWALK_EVERY * 0.5
  while (s < span.to) {
    if (!isStraight(track, s - HALF_WIDTH, s + HALF_WIDTH)) {
      s += SKIP
      continue
    }
    crosswalks.push(s)
    s += CROSSWALK_EVERY * (0.7 + rng() * 0.6)
  }
  return crosswalks
}
