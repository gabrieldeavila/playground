import type { RaceSetup } from '../src/domain/career/race-setup'
import { aiInput } from '../src/domain/race/ai'
import { createRace } from '../src/domain/race/create-race'
import { placeOf } from '../src/domain/race/standings'
import { stepRace } from '../src/domain/race/step-race'
import type { AiProfile, Race, RaceEvent, RiderInput } from '../src/domain/race/types'
import { createRng } from '../src/domain/random'
import { emptyStreet } from '../src/domain/street/create-street'
import type { Track } from '../src/domain/track/types'
import type { PlayerModel } from './player-models'

const DT = 1 / 120 // mesmo passo de game/fixed-loop.ts
const TIME_LIMIT = 400
const BLIND_STREET = emptyStreet()

export type DownCause = 'car crash' | 'prop crash' | 'ped crash' | 'KO by cop' | 'KO by bot'

export interface Outcome {
  place: number | null // null = preso
  bustCause: DownCause | 'slowed down' | null // o que derrubou o jogador antes de ser preso
  time: number
  carCrashes: number
  knockouts: number
  pedestrians: number // atropelados pelo jogador
}

// Mesma semente do jogo (Session usa n * 7919): a corrida n do sim é a corrida n do jogo.
export function runRace(track: Track, setup: RaceSetup, model: PlayerModel, n: number): Outcome {
  const race = createRace(track, setup.riders, n * 7919, { trafficScale: setup.trafficScale, hazardScale: setup.hazardScale, rules: setup.rules })
  const lapseRng = createRng(n * 31 + 1)
  const profile: AiProfile = { pace: model.pace, aggression: model.aggression, wander: 0.3, phase: 0 }
  const out: Outcome = { place: null, bustCause: null, time: 0, carCrashes: 0, knockouts: 0, pedestrians: 0 }
  let lastDown: DownCause | null = null
  let lapseLeft = 0
  while (race.time < TIME_LIMIT && race.phase !== 'finished' && race.phase !== 'busted') {
    if (lapseLeft > 0) lapseLeft -= DT
    else if (lapseRng() < DT / model.lapseEvery) lapseLeft = model.lapseLength
    for (const event of stepRace(race, playerInput(race, profile, lapseLeft > 0), DT)) {
      lastDown = tally(out, event, race) ?? lastDown
    }
  }
  out.time = race.time
  if (race.phase === 'busted') out.bustCause = race.riders[race.playerId].crashTimer > 0 ? lastDown : 'slowed down'
  else out.place ??= placeOf(race, race.playerId)
  return out
}

// O cérebro dos bots dirige o jogador; durante um lapso ele não enxerga carros nem o que há na rua.
function playerInput(race: Race, profile: AiProfile, lapsing: boolean): RiderInput {
  const player = race.riders[race.playerId]
  return aiInput({ ...player, ai: profile }, lapsing ? { ...race, cars: [], street: BLIND_STREET } : race, DT)
}

// Conta o evento no resultado; devolve o motivo se ele derrubou o jogador.
function tally(out: Outcome, event: RaceEvent, race: Race): DownCause | null {
  if (event.kind === 'finish' && event.riderId === race.playerId) out.place = event.place
  if (event.kind === 'crash' && event.riderId === race.playerId) {
    if (event.car) out.carCrashes++
    return event.car ? 'car crash' : 'prop crash'
  }
  if (event.kind === 'pedestrian' && event.riderId === race.playerId) {
    out.pedestrians++
    return event.crashed ? 'ped crash' : null
  }
  if (event.kind === 'knockout' && event.targetId === race.playerId) {
    out.knockouts++
    return race.riders[event.attackerId].role === 'cop' ? 'KO by cop' : 'KO by bot'
  }
  return null
}
