import { describe, expect, it } from 'vitest'
import { testRider } from '../domain/race/test-riders'
import type { Race } from '../domain/race/types'
import type { Prop } from '../domain/track/types'
import type { Car } from '../domain/traffic/types'
import { PassBys } from './pass-bys'

const prop = (kind: Prop['kind'], s: number, x: number): Prop => ({ kind, s, x, scale: 1, rotation: 0 })
const props = [prop('post', 105, 8), prop('rail', 106, 7.4), prop('tree', 107, 40), prop('gantry', 108, 0)]

function race(playerS: number, rivalS: number, cars: Car[] = []): Race {
  const riders = [testRider(0, { s: playerS, speed: 40 }), testRider(1, { s: rivalS, x: -2, speed: 30 })]
  return { playerId: 0, riders, cars, track: { props } } as unknown as Race
}

const oncoming = (s: number): Car => ({ id: 0, kind: 'taxi', s, x: -1.6, speed: 20, direction: -1 })

describe('PassBys', () => {
  it('ouve o que ficou para trás, menos guard-rail e o que está longe', () => {
    const passBys = new PassBys()
    passBys.take(race(100, 200))
    expect(passBys.take(race(110, 200))).toEqual([
      { lateral: 8, speed: 40, sound: 'prop' },
      { lateral: 0, speed: 40, sound: 'overhead' },
    ])
  })

  it('ouve a moto ultrapassada, com a velocidade relativa', () => {
    const passBys = new PassBys()
    passBys.take(race(100, 101))
    expect(passBys.take(race(102, 101.5))).toContainEqual({ lateral: -2, speed: 10, sound: 'prop' })
  })

  it('carro na contramão passa com a soma das velocidades', () => {
    const passBys = new PassBys()
    passBys.take(race(300, 0, [oncoming(301)]))
    expect(passBys.take(race(301, 0, [oncoming(300)]))).toEqual([{ lateral: -1.6, speed: 60, sound: 'vehicle' }])
  })

  it('carro dando a volta na pista não conta como passagem', () => {
    const passBys = new PassBys()
    passBys.take(race(300, 0, [oncoming(301)]))
    expect(passBys.take(race(301, 0, [oncoming(-4000)]))).toEqual([])
  })
})
