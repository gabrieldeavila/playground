import type { Rider } from '../race/types'
import type { Car } from '../traffic/types'
import { stepCones } from './step-cones'
import { stepPedestrians } from './step-pedestrians'
import type { Street } from './types'

// O que se mexe na rua sozinho: pedestres e cones voando. Anda junto com o trânsito.
export function stepStreet(street: Street, cars: Car[], riders: Rider[], dt: number): void {
  stepPedestrians(street.pedestrians, cars, riders, street.rng, dt)
  stepCones(street.cones, cars, street.rng, dt)
}
