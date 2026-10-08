import { describe, expect, it } from 'vitest'
import type { Prop, Track } from '../track/types'
import { RIDER_RADIUS } from './constants'
import { scrapeRails } from './rails'
import { testRider } from './test-riders'

const RAIL_X = 7.4
const rail = (s: number, side: 1 | -1): Prop => ({ kind: 'rail', s, x: side * RAIL_X, scale: 1, rotation: 0 })
const track = { props: [rail(102, 1)] } as Track

describe('scrapeRails', () => {
  it('segura a moto antes do guard-rail e tira velocidade', () => {
    const rider = testRider(0, { s: 100, x: 7.3, speed: 40 })
    scrapeRails(track, rider, 0.1)
    expect(rider.x).toBeCloseTo(RAIL_X - RIDER_RADIUS)
    expect(rider.speed).toBeLessThan(40)
    expect(rider.pushVel).toBeLessThan(0)
    expect(rider.scraping).toBe(true)
  })

  it('não faz nada do outro lado da pista nem longe do guard-rail', () => {
    const left = testRider(0, { s: 100, x: -7.3, speed: 40 })
    const far = testRider(1, { s: 120, x: 7.3, speed: 40 })
    for (const rider of [left, far]) scrapeRails(track, rider, 0.1)
    expect(left.speed).toBe(40)
    expect(far.x).toBe(7.3)
    expect(far.scraping).toBe(false)
  })

  it('quem já está atrás do guard-rail passa livre', () => {
    const rider = testRider(0, { s: 100, x: RAIL_X + 3, speed: 20 })
    scrapeRails(track, rider, 0.1)
    expect(rider.x).toBe(RAIL_X + 3)
  })
})
