import { curveAt } from '../track/pose'
import { hitCar } from '../traffic/car-collisions'
import { CAR_CRASH_DAMAGE } from '../traffic/constants'
import { stepTraffic } from '../traffic/step-traffic'
import { aiInput, coastInput } from './ai'
import { hitsProp, resolveBumps } from './collisions'
import { startAttack, stepAttack } from './combat'
import { PROP_CRASH_DAMAGE } from './constants'
import { knockOff } from './crash'
import { stepMotion } from './motion'
import { scrapeRails } from './rails'
import type { Race, RaceEvent, Rider, RiderInput } from './types'

// Avança a corrida um passo fixo. Continua rodando depois da chegada do jogador.
// O trânsito anda desde a contagem regressiva.
export function stepRace(race: Race, playerInput: RiderInput, dt: number): RaceEvent[] {
  stepTraffic(race.cars, race.track.length, dt)
  if (race.phase === 'countdown') {
    race.countdown -= dt
    if (race.countdown <= 0) race.phase = 'racing'
    return []
  }
  race.time += dt
  const events: RaceEvent[] = []
  for (const rider of race.riders) events.push(...stepRider(race, rider, inputFor(race, rider, playerInput, dt), dt))
  resolveBumps(race.riders)
  for (const rider of race.riders) {
    const finish = checkFinish(race, rider)
    if (finish) events.push(finish)
  }
  if (race.riders[race.playerId].finishTime !== null) race.phase = 'finished'
  return events
}

function inputFor(race: Race, rider: Rider, playerInput: RiderInput, dt: number): RiderInput {
  if (rider.finishTime !== null) return coastInput(rider, curveAt(race.track, rider.s))
  return rider.ai ? aiInput(rider, race, dt) : playerInput
}

function stepRider(race: Race, rider: Rider, input: RiderInput, dt: number): RaceEvent[] {
  if (input.punch) startAttack(rider, 'punch', race.riders)
  else if (input.kick) startAttack(rider, 'kick', race.riders)
  stepMotion(rider, input, curveAt(race.track, rider.s), dt)
  rider.s = Math.min(rider.s, race.track.length - 1)
  scrapeRails(race.track, rider, dt)
  const events = stepAttack(rider, race.riders, dt)
  const crash = checkCrash(race, rider)
  if (crash) events.push(crash)
  return events
}

// Bateu num carro ou em algo na beira da estrada?
function checkCrash(race: Race, rider: Rider): RaceEvent | null {
  const car = hitCar(rider, race.cars)
  if (car) {
    rider.health = Math.max(0, rider.health - CAR_CRASH_DAMAGE)
    knockOff(rider, rider.x >= car.x ? 1 : -1)
    return { kind: 'crash', riderId: rider.id, car: car.kind }
  }
  if (!hitsProp(race.track, rider)) return null
  rider.health = Math.max(0, rider.health - PROP_CRASH_DAMAGE)
  knockOff(rider, rider.x > 0 ? 1 : -1)
  return { kind: 'crash', riderId: rider.id, car: null }
}

function checkFinish(race: Race, rider: Rider): RaceEvent | null {
  if (rider.finishTime !== null || rider.s < race.track.finishS) return null
  rider.finishTime = race.time
  race.finishOrder.push(rider.id)
  return { kind: 'finish', riderId: rider.id, place: race.finishOrder.length }
}
