import { ROAD_HALF_WIDTH } from '../track/constants'
import { propBlocks } from '../track/prop-colliders'
import { propsNear } from '../track/props-near'
import type { Track } from '../track/types'
import { BUMP_PUSH, PROP_CRASH_MIN_SPEED, RIDER_HALF_LENGTH, RIDER_RADIUS } from './constants'
import type { Rider } from './types'

// Bateu em algo na beira da estrada rápido demais?
export function hitsProp(track: Track, rider: Rider): boolean {
  if (rider.crashTimer > 0 || rider.speed < PROP_CRASH_MIN_SPEED) return false
  if (Math.abs(rider.x) <= ROAD_HALF_WIDTH) return false
  return propsNear(track, rider.s, RIDER_HALF_LENGTH).some((prop) => propBlocks(prop, rider.x, RIDER_RADIUS))
}

// Motos encostadas se empurram para os lados e a de trás não atravessa a da frente.
export function resolveBumps(riders: Rider[]): void {
  for (let i = 0; i < riders.length; i++) {
    for (let j = i + 1; j < riders.length; j++) bump(riders[i], riders[j])
  }
}

function bump(a: Rider, b: Rider): void {
  if (a.crashTimer > 0 || b.crashTimer > 0) return
  const dx = b.x - a.x
  if (Math.abs(b.s - a.s) >= 2 * RIDER_HALF_LENGTH || Math.abs(dx) >= 2 * RIDER_RADIUS) return
  const dir = dx >= 0 ? 1 : -1
  a.pushVel = -dir * BUMP_PUSH
  b.pushVel = dir * BUMP_PUSH
  const [rear, front] = a.s < b.s ? [a, b] : [b, a]
  rear.speed = Math.min(rear.speed, front.speed)
}
