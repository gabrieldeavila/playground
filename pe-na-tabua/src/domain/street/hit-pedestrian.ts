import { knockOff } from '../race/crash'
import { RIDER_HALF_LENGTH, RIDER_RADIUS } from '../race/constants'
import type { Rider } from '../race/types'
import type { Rng } from '../random'
import {
  PEDESTRIAN_CRASH_DAMAGE,
  PEDESTRIAN_CRASH_SPEED,
  PEDESTRIAN_DOWN_TIME,
  PEDESTRIAN_JOLT,
  PEDESTRIAN_RADIUS,
  PEDESTRIAN_SPEED_LOSS,
} from './constants'
import { launch } from './flight'
import type { Pedestrian } from './types'

const MIN_SPEED = 2 // m/s
const CARRY = 0.55 // fração da velocidade da moto com que o pedestre é jogado para frente

export interface PedestrianHit {
  pedestrian: Pedestrian
  crashed: boolean // a moto caiu junto
}

// Pedestre em pé no caminho: ele voa e fica caído um tempo. Devagar, a moto só perde
// velocidade e balança; rápido (PEDESTRIAN_CRASH_SPEED), cai junto e machuca.
export function hitPedestrian(rider: Rider, pedestrians: Pedestrian[], rng: Rng): PedestrianHit | null {
  if (rider.crashTimer > 0 || rider.grace > 0 || rider.speed < MIN_SPEED) return null
  const ped = pedestrians.find((p) => p.state !== 'down' && touches(rider, p))
  if (!ped) return null
  const side = ped.x >= rider.x ? 1 : -1
  ped.state = 'down'
  ped.timer = PEDESTRIAN_DOWN_TIME
  ped.flight = launch(rider.speed, side, rng, CARRY)
  const crashed = rider.speed >= PEDESTRIAN_CRASH_SPEED
  if (crashed) {
    rider.health = Math.max(0, rider.health - PEDESTRIAN_CRASH_DAMAGE)
    knockOff(rider, side)
  } else {
    rider.speed = Math.max(0, rider.speed - PEDESTRIAN_SPEED_LOSS)
    rider.pushVel = -side * PEDESTRIAN_JOLT
  }
  return { pedestrian: ped, crashed }
}

function touches(rider: Rider, ped: Pedestrian): boolean {
  return Math.abs(rider.x - ped.x) < RIDER_RADIUS + PEDESTRIAN_RADIUS && Math.abs(rider.s - ped.s) < RIDER_HALF_LENGTH + PEDESTRIAN_RADIUS
}
