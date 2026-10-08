import type { Rider } from '../race/types'
import { CAR_HALF_WIDTH } from './constants'
import type { Car } from './types'

const HONK_TIME = 1.6 // s até a batida
const HONK_LANE = CAR_HALF_WIDTH + 1

// Carro na contramão buzina quando o piloto vem de frente na faixa dele.
export function wantsToHonk(car: Car, rider: Rider): boolean {
  if (car.direction !== -1 || rider.crashTimer > 0) return false
  const gap = car.s - rider.s
  if (gap <= 0 || Math.abs(car.x - rider.x) > HONK_LANE) return false
  return gap / (rider.speed + car.speed) < HONK_TIME
}
