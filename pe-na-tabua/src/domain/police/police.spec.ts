import { describe, expect, it } from 'vitest'
import { createRace } from '../race/create-race'
import { MAX_SPEED } from '../race/constants'
import { POLICE, ROSTER } from '../race/roster'
import { standings } from '../race/standings'
import { stepRace } from '../race/step-race'
import { testInput } from '../race/test-riders'
import type { Race } from '../race/types'
import { SERRA } from '../track/courses/serra'
import { createTrack } from '../track/create-track'
import { alertCops } from './alert'
import { stepBust } from './bust'
import { ALERT_RANGE, BUST_TIME, PATROL_X } from './constants'
import { copInput } from './cop-ai'
import { nearestChasingCop } from './nearest-cop'

const track = createTrack(SERRA)

function freshRace(): Race {
  const race = createRace(track, [...ROSTER, ...POLICE], 1)
  race.cars = []
  race.phase = 'racing'
  return race
}

const copsOf = (race: Race) => race.riders.filter((r) => r.role === 'cop')

describe('polícia', () => {
  it('espera parada no acostamento, fora da corrida', () => {
    const race = freshRace()
    const [first, second] = copsOf(race)
    expect(first.x).toBe(PATROL_X)
    expect(second.s).toBeGreaterThan(first.s)
    expect(first.speedFactor).toBeGreaterThan(1)
    expect(standings(race).some((r) => r.role === 'cop')).toBe(false)
    expect(copInput(first, race, 0.01).throttle).toBe(0)
  })

  it('sai atrás do jogador quando ele chega perto, uma vez só', () => {
    const race = freshRace()
    const [cop] = copsOf(race)
    const player = race.riders[race.playerId]
    player.s = cop.s - ALERT_RANGE - 10
    expect(alertCops(race)).toEqual([])
    player.s = cop.s - ALERT_RANGE + 5
    expect(alertCops(race)).toEqual([{ kind: 'chase', copId: cop.id }])
    expect(alertCops(race)).toEqual([])
    expect(nearestChasingCop(race, 100)?.cop).toBe(cop)
  })

  it('perseguindo: acelera tudo de longe e para do lado do jogador caído', () => {
    const race = freshRace()
    const [cop] = copsOf(race)
    const player = race.riders[race.playerId]
    cop.chasing = true
    Object.assign(player, { s: cop.s + 200, speed: MAX_SPEED })
    expect(copInput(cop, race, 0.01).throttle).toBe(1)
    Object.assign(player, { s: cop.s, speed: 0, crashTimer: 1 })
    cop.speed = 20
    expect(copInput(cop, race, 0.01).brake).toBeGreaterThan(0)
  })

  it('colado e um pouco à frente, não freia o jogador até parar', () => {
    const race = freshRace()
    const [cop] = copsOf(race)
    const player = race.riders[race.playerId]
    cop.chasing = true
    Object.assign(player, { s: cop.s - 1, x: cop.x - 1.3, speed: 40 })
    cop.speed = 39
    const input = copInput(cop, race, 0.01)
    expect(input.throttle).toBe(1)
    expect(input.brake).toBe(0)
  })

  it('prende quem fica caído com um policial do lado', () => {
    const race = freshRace()
    const [cop] = copsOf(race)
    const player = race.riders[race.playerId]
    cop.chasing = true
    Object.assign(player, { s: cop.s + 1, x: cop.x - 1, speed: 0, crashTimer: 2 })
    expect(stepBust(race, BUST_TIME / 2)).toBeNull()
    expect(stepBust(race, BUST_TIME / 2)).toBe(cop)
  })

  it('não prende quem está andando nem com o policial caído', () => {
    const race = freshRace()
    const [cop] = copsOf(race)
    const player = race.riders[race.playerId]
    cop.chasing = true
    Object.assign(player, { s: cop.s + 1, x: cop.x - 1, speed: 30 })
    expect(stepBust(race, 2)).toBeNull()
    Object.assign(player, { speed: 0, crashTimer: 2 })
    cop.crashTimer = 1
    expect(stepBust(race, 2)).toBeNull()
    expect(race.bustTimer).toBe(0)
  })

  it('preso, a corrida do jogador acaba com o evento busted', () => {
    const race = freshRace()
    const [cop] = copsOf(race)
    const player = race.riders[race.playerId]
    cop.chasing = true
    Object.assign(player, { s: cop.s + 1, x: cop.x - 1, speed: 0, crashTimer: 2 })
    const events = []
    for (let t = 0; t < BUST_TIME + 0.1; t += 1 / 120) events.push(...stepRace(race, testInput(), 1 / 120))
    expect(race.phase).toBe('busted')
    expect(events).toContainEqual({ kind: 'busted', copId: cop.id })
  })
})
