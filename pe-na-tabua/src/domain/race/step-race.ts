import { alertCops } from '../police/alert'
import { stepBust } from '../police/bust'
import { copInput } from '../police/cop-ai'
import { stepStreet } from '../street/step-street'
import { streetHits } from '../street/street-hits'
import { curveAt } from '../track/pose'
import { hitCar } from '../traffic/car-collisions'
import { stepTraffic } from '../traffic/step-traffic'
import { aiInput, coastInput } from './ai'
import { catchUpBoost } from './catch-up'
import { hitsProp, resolveBumps } from './collisions'
import { startAttack, stepAttack } from './combat'
import { PROP_CRASH_DAMAGE } from './constants'
import { knockOff } from './crash'
import { stepMotion } from './motion'
import { scrapeRails } from './rails'
import type { Race, RaceEvent, Rider, RiderInput } from './types'

// Avança a corrida um passo fixo. Continua rodando depois da chegada do jogador.
// O trânsito e os pedestres andam desde a contagem regressiva.
export function stepRace(race: Race, playerInput: RiderInput, dt: number): RaceEvent[] {
  stepTraffic(race.cars, race.track.length, dt, race.rng)
  stepStreet(race.street, race.cars, race.riders, dt)
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
  events.push(...alertCops(race), ...checkBusted(race, dt))
  if (race.phase === 'racing' && race.riders[race.playerId].finishTime !== null) race.phase = 'finished'
  return events
}

// Preso: a corrida do jogador acaba ali (os outros seguem até a chegada).
function checkBusted(race: Race, dt: number): RaceEvent[] {
  if (race.phase !== 'racing') return []
  const cop = stepBust(race, dt)
  if (!cop) return []
  race.phase = 'busted'
  return [{ kind: 'busted', copId: cop.id }]
}

function inputFor(race: Race, rider: Rider, playerInput: RiderInput, dt: number): RiderInput {
  const stopped = rider.ai === null && race.phase === 'busted'
  if (rider.finishTime !== null || stopped) return coastInput(rider, curveAt(race.track, rider.s))
  if (rider.role === 'cop') return copInput(rider, race, dt)
  return rider.ai ? aiInput(rider, race, dt) : playerInput
}

function stepRider(race: Race, rider: Rider, input: RiderInput, dt: number): RaceEvent[] {
  if (input.punch) startAttack(rider, 'punch', race.riders)
  else if (input.kick) startAttack(rider, 'kick', race.riders)
  const fromS = rider.s
  stepMotion(rider, input, curveAt(race.track, rider.s), dt, rider.id === race.playerId ? catchUpBoost(race) : 1)
  rider.s = Math.min(rider.s, race.track.length - 1)
  scrapeRails(race.track, rider, dt)
  const events = stepAttack(rider, race.riders, dt)
  const crash = checkCrash(race, rider)
  if (crash) events.push(crash)
  events.push(...streetHits(race, rider, fromS))
  return events
}

// Bateu num carro ou em algo na beira da estrada?
function checkCrash(race: Race, rider: Rider): RaceEvent | null {
  const car = hitCar(rider, race.cars)
  if (car) {
    rider.health = Math.max(0, rider.health - race.rules.carCrashDamage)
    knockOff(rider, rider.x >= car.x ? 1 : -1)
    return { kind: 'crash', riderId: rider.id, car: car.kind }
  }
  if (!hitsProp(race.track, rider)) return null
  rider.health = Math.max(0, rider.health - PROP_CRASH_DAMAGE)
  knockOff(rider, rider.x > 0 ? 1 : -1)
  return { kind: 'crash', riderId: rider.id, car: null }
}

function checkFinish(race: Race, rider: Rider): RaceEvent | null {
  if (rider.role === 'cop' || rider.finishTime !== null || rider.s < race.track.finishS) return null
  rider.finishTime = race.time
  race.finishOrder.push(rider.id)
  return { kind: 'finish', riderId: rider.id, place: race.finishOrder.length }
}
