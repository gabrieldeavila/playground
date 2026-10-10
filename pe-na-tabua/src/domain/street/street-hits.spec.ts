import { describe, expect, it } from 'vitest'
import { createRace } from '../race/create-race'
import { ROSTER, policeAt } from '../race/roster'
import { testRider } from '../race/test-riders'
import { createRng } from '../random'
import { CENTRO } from '../track/courses/centro'
import { createTrack } from '../track/create-track'
import { testCar } from '../traffic/test-cars'
import { PEDESTRIAN_CRASH_SPEED } from './constants'
import { hitCones } from './hit-cone'
import { hitPedestrian } from './hit-pedestrian'
import { hitPothole } from './hit-pothole'
import { stepCones } from './step-cones'
import { streetHits } from './street-hits'
import { testCone, testPedestrian, testStreet } from './test-street'

describe('hitPothole', () => {
  const hole = { s: 200, x: 1, radius: 0.6 }

  it('passar por cima tira velocidade e dá um tranco para o lado', () => {
    const rider = testRider(0, { s: 201, x: 1.3, speed: 50 })
    expect(hitPothole(rider, [hole], 199)).toBe(true)
    expect(rider.speed).toBeLessThan(50)
    expect(rider.pushVel).toBeGreaterThan(0)
    expect(rider.crashTimer).toBe(0)
  })

  it('não conta de lado, devagar, nem duas vezes', () => {
    expect(hitPothole(testRider(0, { s: 201, x: 3, speed: 50 }), [hole], 199)).toBe(false)
    expect(hitPothole(testRider(0, { s: 201, x: 1, speed: 4 }), [hole], 199)).toBe(false)
    expect(hitPothole(testRider(0, { s: 201.5, x: 1, speed: 50 }), [hole], 201)).toBe(false)
  })
})

describe('hitCones', () => {
  it('cone acertado voa e a moto perde um pouco', () => {
    const cone = testCone({ s: 200, x: 0.3 })
    const rider = testRider(0, { s: 200, x: 0, speed: 40 })
    expect(hitCones(rider, [cone], createRng(1))).toBe(1)
    expect(cone.flight?.vs).toBeGreaterThan(0)
    expect(rider.speed).toBeLessThan(40)
    expect(hitCones(rider, [cone], createRng(1))).toBe(0)
  })

  it('carro trocando de faixa por cima dos cones também derruba', () => {
    const cone = testCone({ s: 200, x: 3.25 })
    stepCones([cone], [testCar({ s: 200, x: 3 })], createRng(1), 0.01)
    expect(cone.flight).not.toBeNull()
  })
})

describe('hitPedestrian', () => {
  it('devagar: o pedestre voa, a moto só perde velocidade', () => {
    const ped = testPedestrian({ s: 200, x: 0 })
    const rider = testRider(0, { s: 200, x: 0.2, speed: 15 })
    expect(hitPedestrian(rider, [ped], createRng(1))).toMatchObject({ crashed: false })
    expect(ped.state).toBe('down')
    expect(rider.speed).toBeLessThan(15)
    expect(rider.crashTimer).toBe(0)
  })

  it('rápido: a moto cai junto e machuca', () => {
    const rider = testRider(0, { s: 200, x: 0, speed: PEDESTRIAN_CRASH_SPEED + 5 })
    expect(hitPedestrian(rider, [testPedestrian({ s: 200, x: 0 })], createRng(1))).toMatchObject({ crashed: true })
    expect(rider.crashTimer).toBeGreaterThan(0)
    expect(rider.health).toBeLessThan(100)
  })

  it('quem já está caído não conta de novo', () => {
    const ped = testPedestrian({ s: 200, x: 0, state: 'down' })
    expect(hitPedestrian(testRider(0, { s: 200, x: 0, speed: 30 }), [ped], createRng(1))).toBeNull()
  })
})

describe('streetHits', () => {
  it('atropelar perto da polícia faz ela vir atrás do jogador', () => {
    const race = createRace(createTrack(CENTRO), [...ROSTER, ...policeAt([0.3])], 1)
    const player = race.riders[race.playerId]
    const cop = race.riders.find((r) => r.role === 'cop')!
    Object.assign(player, { s: cop.s - 200, x: 0, speed: 15 })
    race.street = testStreet({ pedestrians: [testPedestrian({ s: player.s, x: 0 })] })
    const events = streetHits(race, player, player.s - 0.1)
    expect(events.map((e) => e.kind)).toEqual(['pedestrian', 'chase'])
    expect(cop.chasing).toBe(true)
  })
})
