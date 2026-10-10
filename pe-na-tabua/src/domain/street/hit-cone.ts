import { RIDER_HALF_LENGTH, RIDER_RADIUS } from '../race/constants'
import type { Rider } from '../race/types'
import type { Rng } from '../random'
import { CONE_RADIUS, CONE_SPEED_LOSS } from './constants'
import { launch } from './flight'
import type { Cone } from './types'

const MIN_SPEED = 2 // m/s: empurrando a moto, o cone não voa

// Moto passando por cima de cones em pé: eles voam para frente e a moto perde um pouco.
// Devolve quantos acertou.
export function hitCones(rider: Rider, cones: Cone[], rng: Rng): number {
  if (rider.crashTimer > 0 || rider.speed < MIN_SPEED) return 0
  let hits = 0
  for (const cone of cones) {
    if (cone.flight || !touches(rider, cone)) continue
    cone.flight = launch(rider.speed, cone.x >= rider.x ? 1 : -1, rng)
    rider.speed = Math.max(0, rider.speed - CONE_SPEED_LOSS)
    hits++
  }
  return hits
}

function touches(rider: Rider, cone: Cone): boolean {
  return Math.abs(rider.x - cone.x) < RIDER_RADIUS + CONE_RADIUS && Math.abs(rider.s - cone.s) < RIDER_HALF_LENGTH + CONE_RADIUS
}
