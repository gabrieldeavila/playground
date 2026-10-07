import { describe, expect, it } from 'vitest'
import { MAX_SPEED } from './constants'
import { GEARS, IDLE_RPM, SHIFT_RPM, gearFor, rpmFor } from './gearbox'

describe('gearbox', () => {
  it('parado: primeira marcha em marcha lenta', () => {
    expect(gearFor(0)).toBe(1)
    expect(rpmFor(0)).toBe(IDLE_RPM)
  })

  it('sobe de marcha com a velocidade, até a última', () => {
    const gears = [0, 0.3, 0.5, 0.6, 0.8, 0.95].map((f) => gearFor(f * MAX_SPEED))
    expect(gears).toEqual([1, 2, 3, 4, 5, 6])
    expect(gearFor(MAX_SPEED)).toBe(GEARS)
  })

  it('o giro cai logo depois de trocar de marcha', () => {
    const shiftSpeed = 0.2 * MAX_SPEED
    expect(rpmFor(shiftSpeed)).toBeCloseTo(SHIFT_RPM)
    expect(rpmFor(shiftSpeed + 0.1)).toBeLessThan(SHIFT_RPM * 0.6)
  })

  it('na velocidade máxima o giro está no ponto de troca', () => {
    expect(rpmFor(MAX_SPEED)).toBeCloseTo(SHIFT_RPM)
  })
})
