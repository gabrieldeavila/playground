import { SEGMENT_LENGTH } from '../track/constants'
import { curveAt } from '../track/pose'
import type { Track } from '../track/types'
import { BRAKE, CENTRIFUGAL, STEER_SPEED } from './constants'

const LOOKAHEAD = 160 // m
const PLANNED_BRAKE = BRAKE * 0.45 // desaceleração com que o bot conta para chegar na curva (m/s²)

// Velocidade em que o guidão todo virado ainda segura a moto na curva `curve`.
export function gripSpeed(curve: number): number {
  return Math.sqrt(STEER_SPEED / (Math.abs(curve) * CENTRIFUGAL))
}

// Velocidade máxima agora para ainda dar tempo de frear antes de cada curva à frente.
// Infinity = nenhuma curva aperta (todas as da Serra e do Litoral dão para fazer de pé embaixo).
export function cornerSpeed(track: Track, s: number): number {
  let limit = Infinity
  for (let d = 0; d <= LOOKAHEAD; d += SEGMENT_LENGTH) {
    const curve = curveAt(track, s + d)
    if (Math.abs(curve) < 1e-4) continue
    limit = Math.min(limit, Math.sqrt(gripSpeed(curve) ** 2 + 2 * PLANNED_BRAKE * d))
  }
  return limit
}
