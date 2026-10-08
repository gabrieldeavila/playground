import { describe, expect, it } from 'vitest'
import { testRider } from '../domain/race/test-riders'
import type { Race } from '../domain/race/types'
import type { Prop } from '../domain/track/types'
import { PassBys } from './pass-bys'

const prop = (kind: Prop['kind'], s: number, x: number): Prop => ({ kind, s, x, scale: 1, rotation: 0 })

function race(playerS: number, rivalS: number): Race {
  const props = [prop('post', 105, 8), prop('rail', 106, 7.4), prop('tree', 107, 40), prop('gantry', 108, 0)]
  return { playerId: 0, riders: [testRider(0, { s: playerS }), testRider(1, { s: rivalS, x: -2 })], track: { props } } as unknown as Race
}

describe('PassBys', () => {
  it('ouve o que ficou para trás, menos guard-rail e o que está longe', () => {
    const passBys = new PassBys()
    passBys.take(race(100, 200))
    expect(passBys.take(race(110, 200))).toEqual([
      { lateral: 8, overhead: false },
      { lateral: 0, overhead: true },
    ])
  })

  it('ouve a moto que foi ultrapassada', () => {
    const passBys = new PassBys()
    passBys.take(race(100, 101))
    expect(passBys.take(race(102, 101.5))).toContainEqual({ lateral: -2, overhead: false })
  })
})
