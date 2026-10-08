import { describe, expect, it } from 'vitest'
import { MAX_SPEED } from '../../domain/race/constants'
import { blurAmount, createSpeedFeel, feelFov, headAngles, stepSpeedFeel } from './speed-feel'

const DT = 1 / 60

function drive(speeds: number[]) {
  const feel = createSpeedFeel()
  for (const speed of speeds) stepSpeedFeel(feel, speed, DT)
  return feel
}

const ramp = (from: number, to: number, frames: number) => Array.from({ length: frames }, (_, i) => from + ((to - from) * (i + 1)) / frames)

describe('speedFeel', () => {
  it('arrancando o surge fica positivo, freando fica negativo', () => {
    expect(drive(ramp(0, 15, 60)).surge).toBeGreaterThan(0.5)
    expect(drive([...ramp(0, 40, 60), ...ramp(40, 20, 60)]).surge).toBeLessThan(-0.3)
  })

  it('subir marcha dá um tranco que some em menos de um segundo', () => {
    const shifted = drive(ramp(0.2 * MAX_SPEED - 1, 0.2 * MAX_SPEED + 1, 4))
    expect(shifted.kick).toBeGreaterThan(0.8)
    const later = drive([...ramp(0.2 * MAX_SPEED - 1, 0.2 * MAX_SPEED + 1, 4), ...Array(60).fill(0.2 * MAX_SPEED + 1)])
    expect(later.kick).toBeLessThan(0.01)
  })

  it('FOV abre com a velocidade', () => {
    const parked = drive(Array(60).fill(0))
    const cruising = drive(Array(60).fill(MAX_SPEED))
    expect(feelFov(cruising, 60, 14)).toBeGreaterThan(feelFov(parked, 60, 14) + 10)
  })

  it('parado não trepida nem desfoca', () => {
    const parked = drive(Array(60).fill(0))
    const head = headAngles(parked, 1.234)
    for (const angle of [head.pitch, head.yaw, head.roll]) expect(Math.abs(angle)).toBe(0)
    expect(blurAmount(parked)).toBe(0)
    expect(blurAmount(drive(Array(60).fill(MAX_SPEED)))).toBeCloseTo(1)
  })
})
