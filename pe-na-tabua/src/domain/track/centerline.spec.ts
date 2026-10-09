import { describe, expect, it } from 'vitest'
import { SERRA } from './courses/serra'
import { createTrack } from './create-track'
import { poseAt } from './pose'

const straight = createTrack({ ...SERRA, name: 'reta', seed: 1, start: [], body: [{ enter: 0, hold: 100, leave: 0, curve: 0, hill: 0 }], finish: [] })
const rightTurn = createTrack({ ...SERRA, name: 'curva', seed: 1, start: [], body: [{ enter: 0, hold: 100, leave: 0, curve: 0.01, hill: 0 }], finish: [] })

describe('linha central', () => {
  it('reta anda para -z', () => {
    const pose = poseAt(straight, 40)
    expect(pose.x).toBeCloseTo(0)
    expect(pose.z).toBeCloseTo(-40)
  })

  it('offset positivo fica à direita (+x) numa reta', () => {
    expect(poseAt(straight, 40, 3).x).toBeCloseTo(3)
  })

  it('curva positiva vira para a direita', () => {
    const pose = poseAt(rightTurn, 200)
    expect(pose.heading).toBeCloseTo(2)
    expect(pose.x).toBeGreaterThan(0)
  })

  it('mantém o raio da curva', () => {
    // Raio 100 m: depois de 90° o ponto está em (100, -100).
    const pose = poseAt(rightTurn, (Math.PI / 2) * 100)
    expect(pose.x).toBeCloseTo(100, 0)
    expect(pose.z).toBeCloseTo(-100, 0)
  })
})
