import { describe, expect, it } from 'vitest'
import { testRider } from '../race/test-riders'
import { createRng } from '../random'
import { testCar } from '../traffic/test-cars'
import { SIDEWALK_X } from './constants'
import { safeToCross } from './safe-to-cross'
import { stepPedestrians } from './step-pedestrians'
import { testPedestrian } from './test-street'

const run = (seconds: number, step: (dt: number) => void) => {
  for (let t = 0; t < seconds; t += 0.1) step(0.1)
}

describe('safeToCross', () => {
  it('rua vazia: atravessa', () => {
    expect(safeToCross(testPedestrian(), [], [])).toBe(true)
  })

  it('carro vindo que passa durante a travessia: espera', () => {
    expect(safeToCross(testPedestrian({ s: 200 }), [testCar({ s: 100, speed: 20 })], [])).toBe(false)
    expect(safeToCross(testPedestrian({ s: 200 }), [testCar({ s: 300, speed: 20, direction: -1 })], [])).toBe(false)
  })

  it('carro que já passou ou está longe demais: atravessa', () => {
    expect(safeToCross(testPedestrian({ s: 200 }), [testCar({ s: 220, speed: 20 })], [])).toBe(true)
    expect(safeToCross(testPedestrian({ s: 200 }), [testCar({ s: -400, speed: 20 })], [])).toBe(true)
  })

  it('não sai na frente de moto chegando, mas não liga para moto caída ou que já passou', () => {
    expect(safeToCross(testPedestrian({ s: 200 }), [], [testRider(0, { s: 170, speed: 40 })])).toBe(false)
    expect(safeToCross(testPedestrian({ s: 200 }), [], [testRider(0, { s: 170, speed: 40, crashTimer: 1 })])).toBe(true)
    expect(safeToCross(testPedestrian({ s: 200 }), [], [testRider(0, { s: 210, speed: 40 })])).toBe(true)
  })
})

describe('stepPedestrians', () => {
  it('atravessa até a outra calçada e espera lá', () => {
    const ped = testPedestrian()
    run(15, (dt) => stepPedestrians([ped], [], [], createRng(1), dt))
    expect(ped.x).toBe(SIDEWALK_X)
    expect(ped.side).toBe(1)
    expect(ped.state).toBe('waiting')
  })

  it('com carro vindo fica na calçada', () => {
    const ped = testPedestrian()
    stepPedestrians([ped], [testCar({ s: 100, speed: 20 })], [], createRng(1), 0.1)
    expect(ped.state).toBe('waiting')
    expect(ped.x).toBe(-SIDEWALK_X)
  })

  it('atropelado: voa, fica caído e depois vai para a calçada mais perto', () => {
    const ped = testPedestrian({ x: 2, state: 'down', timer: 3, flight: { vs: 10, vx: 1, vy: 3, y: 0, spin: 8, angle: 0, landed: false } })
    run(1.5, (dt) => stepPedestrians([ped], [], [], createRng(1), dt))
    expect(ped.flight?.landed).toBe(true)
    expect(ped.s).toBeGreaterThan(203)
    expect(ped.state).toBe('down')
    run(12, (dt) => stepPedestrians([ped], [], [], createRng(1), dt))
    expect(ped.flight).toBeNull()
    expect(ped.x).toBe(SIDEWALK_X)
  })
})
