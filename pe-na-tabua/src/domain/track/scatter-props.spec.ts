import { describe, expect, it } from 'vitest'
import { createRng } from '../random'
import { buildSegments } from './build-segments'
import { ROAD_HALF_WIDTH } from './constants'
import { scatterProps } from './scatter-props'

const straight = { enter: 0, hold: 130, leave: 0, curve: 0, hill: 0 }
const rightTurn = { enter: 0, hold: 20, leave: 0, curve: 0.01, hill: 0 }

describe('scatterProps', () => {
  it('põe guard-rail só do lado de fora das curvas', () => {
    const props = scatterProps(buildSegments([rightTurn]), createRng(1))
    const rails = props.filter((p) => p.kind === 'rail')
    expect(rails.length).toBeGreaterThan(10)
    expect(rails.every((p) => p.x < -ROAD_HALF_WIDTH)).toBe(true)
  })

  it('põe pórticos sobre as retas, centrados na pista', () => {
    const gantries = scatterProps(buildSegments([straight]), createRng(1)).filter((p) => p.kind === 'gantry')
    expect(gantries.map((p) => p.x)).toEqual([0, 0])
  })

  it('sai ordenado por s', () => {
    const props = scatterProps(buildSegments([straight, rightTurn]), createRng(1))
    for (let i = 1; i < props.length; i++) expect(props[i].s).toBeGreaterThanOrEqual(props[i - 1].s)
  })
})
