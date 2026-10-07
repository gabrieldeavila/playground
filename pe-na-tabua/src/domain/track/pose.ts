import { clamp, lerp } from '../math'
import { SEGMENT_LENGTH } from './constants'
import type { Track } from './types'

export interface Pose {
  x: number
  y: number
  z: number
  heading: number
  pitch: number // positivo = subindo
}

// Converte coordenadas de pista (s ao longo, offset para a direita) em mundo.
export function poseAt(track: Track, s: number, offset = 0): Pose {
  const clamped = clamp(s, 0, track.length - 1e-6)
  const i = Math.floor(clamped / SEGMENT_LENGTH)
  const t = clamped / SEGMENT_LENGTH - i
  const a = track.points[i]
  const b = track.points[i + 1]
  const heading = lerp(a.heading, b.heading, t)
  return {
    x: lerp(a.x, b.x, t) + Math.cos(heading) * offset,
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t) + Math.sin(heading) * offset,
    heading,
    pitch: Math.atan2(b.y - a.y, SEGMENT_LENGTH),
  }
}

export function curveAt(track: Track, s: number): number {
  const i = clamp(Math.floor(s / SEGMENT_LENGTH), 0, track.segments.length - 1)
  return track.segments[i].curve
}
