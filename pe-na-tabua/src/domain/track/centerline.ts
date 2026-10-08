import { SEGMENT_LENGTH } from './constants'
import type { CenterPoint, Segment } from './types'

// Integra a curvatura dos segmentos para achar a linha central no mundo.
export function buildCenterline(segments: Segment[]): CenterPoint[] {
  let x = 0
  let z = 0
  let heading = 0
  const points: CenterPoint[] = [{ x, y: segments[0]?.y0 ?? 0, z, heading }]
  for (const segment of segments) {
    // Usa a direção do meio do segmento para a curva ficar simétrica.
    const turn = segment.curve * SEGMENT_LENGTH
    const mid = heading + turn / 2
    x += Math.sin(mid) * SEGMENT_LENGTH
    z -= Math.cos(mid) * SEGMENT_LENGTH
    heading += turn
    points.push({ x, y: segment.y1, z, heading })
  }
  return points
}
