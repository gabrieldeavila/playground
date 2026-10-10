import type { Rider } from '../race/types'
import { CAR_HALF_LENGTH } from '../traffic/constants'
import { carVelocity } from '../traffic/step-traffic'
import type { Car } from '../traffic/types'
import { CAR_GAP, CROSS_MARGIN, RIDER_LOOK, SIDEWALK_X } from './constants'
import type { Pedestrian } from './types'

// Dá para atravessar a rua inteira sem nenhum carro passar por ali, e sem moto chegando já?
// Carros andam reto numa velocidade só (troca de faixa só muda o x), então basta ver se o
// trecho que cada carro percorre até o pedestre chegar do outro lado passa por ele.
export function safeToCross(ped: Pedestrian, cars: Car[], riders: Rider[]): boolean {
  const time = (2 * SIDEWALK_X) / ped.walkSpeed + CROSS_MARGIN
  return cars.every((car) => !carPasses(ped.s, car, time)) && riders.every((rider) => !riderComing(ped.s, rider))
}

function carPasses(s: number, car: Car, time: number): boolean {
  const reach = CAR_HALF_LENGTH + CAR_GAP
  const now = s - car.s
  const later = now - carVelocity(car) * time
  return Math.min(now, later) < reach && Math.max(now, later) > -reach
}

// Ninguém sai da calçada bem na frente de uma moto: ela ainda pode chegar no meio da travessia.
function riderComing(s: number, rider: Rider): boolean {
  const gap = s - rider.s
  return rider.crashTimer <= 0 && gap > 0 && gap < rider.speed * RIDER_LOOK + 2
}
