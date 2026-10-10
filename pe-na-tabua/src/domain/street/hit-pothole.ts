import { MAX_SPEED } from '../race/constants'
import type { Rider } from '../race/types'
import { POTHOLE_JOLT, POTHOLE_MIN_SPEED, POTHOLE_SPEED_LOSS } from './constants'
import type { Pothole } from './types'

// A roda caiu num buraco neste passo (passou pelo s dele, de `fromS` até agora)?
// Tira velocidade, mais quanto mais rápido, e joga o guidão para longe do centro do buraco.
export function hitPothole(rider: Rider, potholes: Pothole[], fromS: number): boolean {
  if (rider.crashTimer > 0 || rider.speed < POTHOLE_MIN_SPEED) return false
  const hole = potholes.find((p) => p.s > fromS && p.s <= rider.s && Math.abs(rider.x - p.x) < p.radius)
  if (!hole) return false
  rider.speed = Math.max(0, rider.speed - (POTHOLE_SPEED_LOSS * rider.speed) / MAX_SPEED)
  rider.pushVel = (rider.x >= hole.x ? 1 : -1) * POTHOLE_JOLT
  return true
}
