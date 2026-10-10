import { approach } from '../math'
import type { Rider } from '../race/types'
import type { Rng } from '../random'
import type { Car } from '../traffic/types'
import { RETRY_TIME, SIDEWALK_X, WAIT_TIME } from './constants'
import { stepFlight } from './flight'
import { safeToCross } from './safe-to-cross'
import { between } from './street-span'
import type { Pedestrian } from './types'

// Espera, atravessa quando dá, e se foi atropelado fica no chão e depois sai da rua.
export function stepPedestrians(pedestrians: Pedestrian[], cars: Car[], riders: Rider[], rng: Rng, dt: number): void {
  for (const ped of pedestrians) {
    if (ped.state === 'waiting') stepWaiting(ped, cars, riders, dt)
    else if (ped.state === 'crossing') stepCrossing(ped, rng, dt)
    else stepDown(ped, dt)
  }
}

function stepWaiting(ped: Pedestrian, cars: Car[], riders: Rider[], dt: number): void {
  ped.timer -= dt
  if (ped.timer > 0) return
  if (!safeToCross(ped, cars, riders)) {
    ped.timer = RETRY_TIME
    return
  }
  ped.state = 'crossing'
  ped.side = ped.side === 1 ? -1 : 1
}

function stepCrossing(ped: Pedestrian, rng: Rng, dt: number): void {
  const target = ped.side * SIDEWALK_X
  ped.x = approach(ped.x, target, ped.walkSpeed * dt)
  if (ped.x !== target) return
  ped.state = 'waiting'
  ped.timer = between(rng, WAIT_TIME)
}

// Levanta e vai para a calçada mais perto.
function stepDown(ped: Pedestrian, dt: number): void {
  const flight = ped.flight
  if (flight && !flight.landed) {
    const { ds, dx } = stepFlight(flight, dt)
    ped.s += ds
    ped.x += dx
    return
  }
  ped.timer -= dt
  if (ped.timer > 0) return
  ped.flight = null
  ped.state = 'crossing'
  ped.side = ped.x >= 0 ? 1 : -1
}
