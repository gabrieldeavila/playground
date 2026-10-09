import { approach, clamp } from '../math'
import { RIDE_LIMIT, ROAD_HALF_WIDTH } from '../track/constants'
import {
  ACCEL,
  BRAKE,
  CENTRIFUGAL,
  COAST_DECEL,
  CRASH_DECEL,
  FULL_GRIP_SPEED,
  MAX_SPEED,
  OFFROAD_DRAG,
  OFFROAD_SPEED_FACTOR,
  PUSH_DAMPING,
  STEER_RESPONSE,
  STEER_SPEED,
} from './constants'
import { remount } from './crash'
import type { Rider, RiderInput } from './types'

// Avança um piloto em coordenadas de pista. `curve` é a curvatura onde ele está;
// `boost` multiplica a velocidade máxima neste passo (ajuda para quem ficou para trás).
export function stepMotion(rider: Rider, input: RiderInput, curve: number, dt: number, boost = 1): void {
  rider.grace = Math.max(0, rider.grace - dt)
  if (rider.crashTimer > 0) return stepCrashed(rider, dt)
  const offRoad = Math.abs(rider.x) > ROAD_HALF_WIDTH
  rider.speed = nextSpeed(rider.speed, input, offRoad, dt, MAX_SPEED * rider.speedFactor * boost)
  rider.steer = approach(rider.steer, clamp(input.steer, -1, 1), STEER_RESPONSE * dt)
  rider.x = clamp(rider.x + lateralVelocity(rider, curve) * dt, -RIDE_LIMIT, RIDE_LIMIT)
  rider.pushVel *= Math.exp(-PUSH_DAMPING * dt)
  rider.s += rider.speed * dt
}

// `maxSpeed` é a máxima da moto no asfalto.
export function nextSpeed(speed: number, input: RiderInput, offRoad: boolean, dt: number, maxSpeed = MAX_SPEED): number {
  const top = maxSpeed * (offRoad ? OFFROAD_SPEED_FACTOR : 1)
  let next = speed
  if (input.brake > 0) next -= BRAKE * input.brake * dt
  else if (input.throttle > 0 && next < top) next += ACCEL * input.throttle * (1 - (next / top) ** 2) * dt
  else next -= COAST_DECEL * dt
  if (next > top) next = Math.max(top, next - OFFROAD_DRAG * dt)
  return Math.max(0, next)
}

// Guidão empurra para dentro, a curva joga para fora, golpes empurram de lado.
export function lateralVelocity(rider: Rider, curve: number): number {
  const grip = Math.min(1, rider.speed / FULL_GRIP_SPEED)
  return rider.steer * STEER_SPEED * grip - curve * rider.speed ** 2 * CENTRIFUGAL + rider.pushVel
}

function stepCrashed(rider: Rider, dt: number): void {
  rider.speed = Math.max(0, rider.speed - CRASH_DECEL * dt)
  rider.s += rider.speed * dt
  rider.crashTimer -= dt
  if (rider.crashTimer <= 0) remount(rider)
}
