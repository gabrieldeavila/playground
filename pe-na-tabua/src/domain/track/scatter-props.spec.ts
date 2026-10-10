import { describe, expect, it } from 'vitest'
import { createRng } from '../random'
import { buildSegments } from './build-segments'
import { ROAD_HALF_WIDTH } from './constants'
import { SERRA } from './courses/serra'
import { scatterProps } from './scatter-props'
import type { Scenery } from './types'

const straight = { enter: 0, hold: 130, leave: 0, curve: 0, hill: 0 }
const rightTurn = { enter: 0, hold: 20, leave: 0, curve: 0.01, hill: 0 }

describe('scatterProps', () => {
  it('põe guard-rail só do lado de fora das curvas', () => {
    const props = scatterProps(buildSegments([rightTurn]), createRng(1), SERRA.scenery)
    const rails = props.filter((p) => p.kind === 'rail')
    expect(rails.length).toBeGreaterThan(10)
    expect(rails.every((p) => p.x < -ROAD_HALF_WIDTH)).toBe(true)
  })

  it('põe pórticos sobre as retas, centrados na pista', () => {
    const gantries = scatterProps(buildSegments([straight]), createRng(1), SERRA.scenery).filter((p) => p.kind === 'gantry')
    expect(gantries.map((p) => p.x)).toEqual([0, 0])
  })

  it('sai ordenado por s', () => {
    const props = scatterProps(buildSegments([straight, rightTurn]), createRng(1), SERRA.scenery)
    for (let i = 1; i < props.length; i++) expect(props[i].s).toBeGreaterThanOrEqual(props[i - 1].s)
  })
})

describe('scatterProps com mar', () => {
  const lush: Scenery = { treeChance: 1, nearTreeChance: 1, rockChance: 1, pineShare: 0.5, seaSide: -1, urban: false }
  const props = scatterProps(buildSegments([straight]), createRng(1), lush)

  it('do lado do mar, nada longe do asfalto (estaria na água)', () => {
    const seaSide = props.filter((p) => p.x < 0)
    expect(seaSide.length).toBeGreaterThan(0)
    expect(seaSide.every((p) => -p.x - ROAD_HALF_WIDTH <= 6)).toBe(true)
  })

  it('do outro lado, a mata continua indo longe', () => {
    expect(props.some((p) => p.x - ROAD_HALF_WIDTH > 20)).toBe(true)
  })

  it('a proporção de pinheiros vem do cenário', () => {
    const pines = (pineShare: number) =>
      scatterProps(buildSegments([straight]), createRng(1), { ...lush, pineShare, seaSide: 0 }).filter((p) => p.kind === 'pine').length
    expect(pines(0)).toBe(0)
    expect(pines(1)).toBeGreaterThan(0)
  })
})
