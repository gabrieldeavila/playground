import type { Rng } from '../random'
import { CAR_HALF_LENGTH, CAR_HALF_WIDTH } from '../traffic/constants'
import { carVelocity } from '../traffic/step-traffic'
import type { Car } from '../traffic/types'
import { CONE_RADIUS } from './constants'
import { launch, stepFlight } from './flight'
import type { Cone } from './types'

// Cones voando caem; cone em pé que um carro pega (trocando de faixa) sai voando.
export function stepCones(cones: Cone[], cars: Car[], rng: Rng, dt: number): void {
  for (const cone of cones) {
    if (cone.flight) {
      const { ds, dx } = stepFlight(cone.flight, dt)
      cone.s += ds
      cone.x += dx
      continue
    }
    const car = cars.find((c) => touches(c, cone))
    if (car) cone.flight = launch(carVelocity(car), cone.x >= car.x ? 1 : -1, rng)
  }
}

function touches(car: Car, cone: Cone): boolean {
  return Math.abs(car.x - cone.x) < CAR_HALF_WIDTH + CONE_RADIUS && Math.abs(car.s - cone.s) < CAR_HALF_LENGTH + CONE_RADIUS
}
