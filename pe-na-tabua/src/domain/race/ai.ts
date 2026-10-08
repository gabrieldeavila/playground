import { clamp } from '../math'
import type { Rng } from '../random'
import { ROAD_HALF_WIDTH } from '../track/constants'
import { curveAt } from '../track/pose'
import { nearestOpponent } from './combat'
import { CENTRIFUGAL, MAX_SPEED, STEER_SPEED } from './constants'
import { dodgeLine } from './dodge-cars'
import type { AiProfile, AttackKind, Race, Rider, RiderInput } from './types'

const FIGHT_RADIUS = 6
const FIGHTER_AGGRESSION = 0.35
const ATTACKS_PER_SECOND = 1.8 // com agressividade 1, encostado no alvo
const KICK_CHANCE = 0.35
const RUBBER_BAND_GAP = 120

export function aiInput(rider: Rider, race: Race, dt: number): RiderInput {
  const ai = rider.ai!
  const curve = curveAt(race.track, rider.s)
  const foe = ai.aggression >= FIGHTER_AGGRESSION ? nearestOpponent(rider, race.riders, FIGHT_RADIUS) : null
  const wanted = foe ? besideLine(rider, foe) : cruiseLine(ai, race.time)
  const lineX = dodgeLine(rider, wanted, race.cars) ?? wanted
  const goal = MAX_SPEED * ai.pace * rubberBand(rider, race)
  const attack = chooseAttack(rider, foe, ai, race.rng, dt)
  return {
    throttle: rider.speed < goal ? 1 : 0,
    brake: rider.speed > goal * 1.08 ? 0.4 : 0,
    steer: steerToward(rider, lineX, curve),
    punch: attack === 'punch',
    kick: attack === 'kick',
  }
}

// Depois da chegada: freia e segue reto.
export function coastInput(rider: Rider, curve: number): RiderInput {
  return { throttle: 0, brake: 0.45, steer: steerToward(rider, clamp(rider.x, -3, 3), curve), punch: false, kick: false }
}

// Esterço até `lineX`, já compensando quanto a curva joga para fora.
export function steerToward(rider: Rider, lineX: number, curve: number): number {
  const feedForward = (curve * rider.speed ** 2 * CENTRIFUGAL) / STEER_SPEED
  return clamp((lineX - rider.x) * 0.4 + feedForward, -1, 1)
}

function cruiseLine(ai: AiProfile, time: number): number {
  return Math.sin(time * ai.wander + ai.phase) * (ROAD_HALF_WIDTH - 2)
}

// Encosta ao lado do alvo, do lado em que já está.
function besideLine(rider: Rider, foe: Rider): number {
  const side = rider.x >= foe.x ? 1 : -1
  return clamp(foe.x + side * 1.3, -ROAD_HALF_WIDTH + 0.8, ROAD_HALF_WIDTH - 0.8)
}

// Bots muito à frente aliviam e os muito atrás apertam, para a corrida ficar junta.
function rubberBand(rider: Rider, race: Race): number {
  const player = race.riders.find((r) => r.id === race.playerId)
  const gap = player ? rider.s - player.s : 0
  if (gap > RUBBER_BAND_GAP) return 0.92
  if (gap < -RUBBER_BAND_GAP) return 1.08
  return 1
}

function chooseAttack(rider: Rider, foe: Rider | null, ai: AiProfile, rng: Rng, dt: number): AttackKind | null {
  if (!foe || rider.attack || rider.cooldown > 0) return null
  if (Math.abs(foe.s - rider.s) > 2 || Math.abs(foe.x - rider.x) > 1.9) return null
  if (rng() >= ai.aggression * ATTACKS_PER_SECOND * dt) return null
  return rng() < KICK_CHANCE ? 'kick' : 'punch'
}
