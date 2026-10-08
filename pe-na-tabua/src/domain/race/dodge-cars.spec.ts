import { describe, expect, it } from 'vitest'
import { CAR_HALF_WIDTH } from '../traffic/constants'
import type { Car } from '../traffic/types'
import { dodgeLine } from './dodge-cars'
import { testRider } from './test-riders'

const car = (overrides: Partial<Car> = {}): Car => ({ id: 0, kind: 'sedan', s: 140, x: 1.6, speed: 20, direction: 1, ...overrides })

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
