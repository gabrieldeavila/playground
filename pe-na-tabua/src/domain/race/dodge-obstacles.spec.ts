import { testCar } from '../traffic/test-cars'
import { describe, expect, it } from 'vitest'
import { CAR_HALF_WIDTH } from '../traffic/constants'
import type { Car } from '../traffic/types'
import { dodgeLine } from './dodge-obstacles'
import { testRider } from './test-riders'
import { testCone, testPedestrian, testStreet } from '../street/test-street'

const car = (overrides: Partial<Car> = {}): Car => testCar({ s: 140, speed: 20, ...overrides })

describe('dodgeLine', () => {
  it('caminho livre não muda nada', () => {
    expect(dodgeLine(testRider(0, { s: 100, x: -4, speed: 50 }), -4, [car()])).toBeNull()
  })

  it('carro à frente na linha: desvia para o lado mais perto', () => {
    const line = dodgeLine(testRider(0, { s: 100, x: 2, speed: 50 }), 2, [car()])!
    expect(line).toBeGreaterThan(1.6 + CAR_HALF_WIDTH)
  })

  it('carro na faixa de fora: desvia para dentro da pista', () => {
    const line = dodgeLine(testRider(0, { s: 100, x: 5, speed: 50 }), 5, [car({ x: 4.9 })])!
    expect(line).toBeLessThan(4.9 - CAR_HALF_WIDTH)
  })

  it('carro na contramão longe ainda conta, porque vem rápido', () => {
    expect(dodgeLine(testRider(0, { s: 100, x: -1.6, speed: 50 }), -1.6, [car({ s: 210, x: -1.6, direction: -1 })])).not.toBeNull()
  })
})

describe('dodgeLine na rua', () => {
  it('desvia de cone, pedestre e buraco no caminho', () => {
    const rider = testRider(0, { s: 100, x: 0, speed: 40 })
    expect(dodgeLine(rider, 0, [], testStreet({ cones: [testCone({ s: 130, x: 0 })] }))).not.toBeNull()
    expect(dodgeLine(rider, 0, [], testStreet({ pedestrians: [testPedestrian({ s: 130, x: 0.2 })] }))).not.toBeNull()
    expect(dodgeLine(rider, 0, [], testStreet({ potholes: [{ s: 130, x: -0.3, radius: 0.6 }] }))).not.toBeNull()
  })

  it('cone que já voou e pedestre caído não contam', () => {
    const rider = testRider(0, { s: 100, x: 0, speed: 40 })
    const flight = { vs: 0, vx: 0, vy: 0, y: 0, spin: 0, angle: Math.PI / 2, landed: true }
    const street = testStreet({ cones: [testCone({ s: 130, x: 0, flight })], pedestrians: [testPedestrian({ s: 130, x: 0, state: 'down', flight })] })
    expect(dodgeLine(rider, 0, [], street)).toBeNull()
  })
})
