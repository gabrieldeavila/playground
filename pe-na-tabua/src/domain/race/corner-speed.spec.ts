import { describe, expect, it } from 'vitest'
import { CENTRO } from '../track/courses/centro'
import { LITORAL } from '../track/courses/litoral'
import { SERRA } from '../track/courses/serra'
import { createTrack } from '../track/create-track'
import { MAX_SPEED } from './constants'
import { cornerSpeed, gripSpeed } from './corner-speed'

const lowest = (course: typeof SERRA) => {
  const track = createTrack(course)
  let low = Infinity
  for (let s = 0; s < track.length; s += 4) low = Math.min(low, cornerSpeed(track, s))
  return low
}

describe('cornerSpeed', () => {
  it('curva mais fechada segura menos velocidade', () => {
    expect(gripSpeed(0.025)).toBeLessThan(gripSpeed(0.01))
  })

  it('Serra e Litoral dão para fazer de pé embaixo, até com a moto mais rápida da polícia', () => {
    expect(lowest(SERRA)).toBeGreaterThan(MAX_SPEED * 1.05)
    expect(lowest(LITORAL)).toBeGreaterThan(MAX_SPEED * 1.05)
  })

  it('nas esquinas do Centro tem que frear', () => {
    expect(lowest(CENTRO)).toBeLessThan(MAX_SPEED * 0.85)
  })
})
