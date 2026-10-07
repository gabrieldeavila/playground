import { describe, expect, it } from 'vitest'
import { ROAD_HALF_WIDTH } from '../track/constants'
import { CRASH_TIME, MAX_SPEED, OFFROAD_SPEED_FACTOR, RECOVER_HEALTH } from './constants'
import { knockOff } from './crash'
import { stepMotion } from './motion'
import { testInput, testRider } from './test-riders'

const DT = 1 / 120

function run(seconds: number, step: () => void): void {
  for (let t = 0; t < seconds; t += DT) step()
}

describe('stepMotion', () => {
  it('acelera com o acelerador e não passa da máxima', () => {
    const rider = testRider(0)
    run(1, () => stepMotion(rider, testInput({ throttle: 1 }), 0, DT))
    expect(rider.speed).toBeGreaterThan(10)
    run(30, () => stepMotion(rider, testInput({ throttle: 1 }), 0, DT))
    expect(rider.speed).toBeLessThanOrEqual(MAX_SPEED)
    expect(rider.speed).toBeGreaterThan(MAX_SPEED * 0.95)
  })

  it('fora do asfalto a velocidade máxima cai', () => {
    const rider = testRider(0, { x: ROAD_HALF_WIDTH + 3, speed: MAX_SPEED })
    run(5, () => stepMotion(rider, testInput({ throttle: 1 }), 0, DT))
    expect(rider.speed).toBeCloseTo(MAX_SPEED * OFFROAD_SPEED_FACTOR, 0)
  })

  it('curva para a direita joga a moto para a esquerda', () => {
    const rider = testRider(0, { speed: 50 })
    run(0.5, () => stepMotion(rider, testInput({ throttle: 1 }), 0.01, DT))
    expect(rider.x).toBeLessThan(-1)
  })

  it('caído, volta para a moto depois do tempo de queda', () => {
    const rider = testRider(0, { speed: 40, health: 0, x: ROAD_HALF_WIDTH + 5 })
    knockOff(rider, 1)
    run(CRASH_TIME + 0.1, () => stepMotion(rider, testInput({ throttle: 1 }), 0, DT))
    expect(rider.crashTimer).toBe(0)
    expect(rider.health).toBe(RECOVER_HEALTH)
    expect(Math.abs(rider.x)).toBeLessThan(ROAD_HALF_WIDTH)
  })
})
