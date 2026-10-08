import { RIDER_HALF_LENGTH, RIDER_RADIUS } from '../race/constants'
import type { Rider } from '../race/types'
import { CAR_CRASH_MIN_SPEED, CAR_HALF_LENGTH, CAR_HALF_WIDTH } from './constants'
import { carVelocity } from './step-traffic'
import type { Car } from './types'

// Carro encostando na moto rápido o bastante para derrubar (null se nenhum).
export function hitCar(rider: Rider, cars: Car[]): Car | null {
  if (rider.crashTimer > 0 || rider.grace > 0) return null
  return (
    cars.find(
      (car) =>
        Math.abs(car.s - rider.s) < CAR_HALF_LENGTH + RIDER_HALF_LENGTH &&
        Math.abs(car.x - rider.x) < CAR_HALF_WIDTH + RIDER_RADIUS &&
        Math.abs(rider.speed - carVelocity(car)) >= CAR_CRASH_MIN_SPEED,
    ) ?? null
  )
}
