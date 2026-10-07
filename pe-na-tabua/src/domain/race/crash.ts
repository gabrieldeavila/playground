import { clamp } from '../math'
import { ROAD_HALF_WIDTH } from '../track/constants'
import { CRASH_TIME, RECOVER_HEALTH } from './constants'
import type { Rider, Side } from './types'

// Derruba o piloto; `side` é o lado para onde ele cai.
export function knockOff(rider: Rider, side: Side): void {
  rider.crashTimer = CRASH_TIME
  rider.crashSide = side
  rider.attack = null
  rider.steer = 0
  rider.pushVel = 0
}

// Volta para a moto, já de volta no asfalto.
export function remount(rider: Rider): void {
  rider.crashTimer = 0
  rider.speed = 0
  rider.x = clamp(rider.x, -(ROAD_HALF_WIDTH - 1), ROAD_HALF_WIDTH - 1)
  rider.health = Math.max(rider.health, RECOVER_HEALTH)
}
