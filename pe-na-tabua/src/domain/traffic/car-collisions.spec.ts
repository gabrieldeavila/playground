import { testCar } from './test-cars'
import { describe, expect, it } from 'vitest'
import { testRider } from '../race/test-riders'
import { hitCar } from './car-collisions'
import type { Car } from './types'

const car = (overrides: Partial<Car> = {}): Car => testCar({ s: 102, speed: 20, ...overrides })

describe('hitCar', () => {
  it('bate na traseira de um carro mais lento', () => {
    expect(hitCar(testRider(0, { s: 100, x: 1.2, speed: 50 }), [car()])).not.toBeNull()
  })

  it('passa raspando ao lado sem bater', () => {
    expect(hitCar(testRider(0, { s: 100, x: 3.2, speed: 50 }), [car()])).toBeNull()
  })

  it('andando junto, na mesma velocidade, não derruba', () => {
    expect(hitCar(testRider(0, { s: 100, x: 1.6, speed: 21 }), [car()])).toBeNull()
  })

  it('logo depois de subir na moto ninguém derruba', () => {
    expect(hitCar(testRider(0, { s: 100, x: 1.6, speed: 0, grace: 1 }), [car({ direction: -1 })])).toBeNull()
  })
})
