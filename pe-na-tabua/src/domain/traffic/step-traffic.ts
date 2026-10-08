import type { Car } from './types'

// Anda com os carros; quem sai por uma ponta da pista volta pela outra.
export function stepTraffic(cars: Car[], trackLength: number, dt: number): void {
  for (const car of cars) {
    car.s += car.direction * car.speed * dt
    if (car.s >= trackLength) car.s -= trackLength
    else if (car.s < 0) car.s += trackLength
  }
}

// Velocidade do carro ao longo da pista, com sinal.
export const carVelocity = (car: Car) => car.direction * car.speed
