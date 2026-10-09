import type { Rng } from '../random'
import { startLaneChanges, stepLaneChange } from './lane-change'
import type { Car } from './types'

// Anda com os carros e com as trocas de faixa; quem sai por uma ponta da pista volta pela outra.
export function stepTraffic(cars: Car[], trackLength: number, dt: number, rng: Rng): void {
  startLaneChanges(cars, trackLength, rng, dt)
  for (const car of cars) {
    stepLaneChange(car, dt)
    car.s += car.direction * car.speed * dt
    if (car.s >= trackLength) car.s -= trackLength
    else if (car.s < 0) car.s += trackLength
  }
}

// Velocidade do carro ao longo da pista, com sinal.
export const carVelocity = (car: Car) => car.direction * car.speed
