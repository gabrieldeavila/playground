import { describe, expect, it } from 'vitest'
import { testRider } from '../race/test-riders'
import { wantsToHonk } from './honk'
import type { Car } from './types'

const oncoming: Car = { id: 0, kind: 'taxi', s: 160, x: -1.6, speed: 20, direction: -1 }

describe('wantsToHonk', () => {
  it('buzina para quem vem de frente na faixa', () => {
    expect(wantsToHonk(oncoming, testRider(0, { s: 100, x: -1.5, speed: 40 }))).toBe(true)
  })

  it('não buzina longe, fora da faixa, nem depois de passar', () => {
    expect(wantsToHonk(oncoming, testRider(0, { s: -100, x: -1.5, speed: 40 }))).toBe(false)
    expect(wantsToHonk(oncoming, testRider(0, { s: 100, x: 2, speed: 40 }))).toBe(false)
    expect(wantsToHonk(oncoming, testRider(0, { s: 170, x: -1.5, speed: 40 }))).toBe(false)
  })

  it('carro no mesmo sentido não buzina', () => {
    expect(wantsToHonk({ ...oncoming, direction: 1 }, testRider(0, { s: 150, x: -1.5, speed: 40 }))).toBe(false)
  })
})
