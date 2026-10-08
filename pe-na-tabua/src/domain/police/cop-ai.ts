import { clamp } from '../math'
import { besideLine, steerToward } from '../race/ai'
import { inReach } from '../race/attacks'
import { MAX_SPEED } from '../race/constants'
import { dodgeLine } from '../race/dodge-cars'
import type { Race, Rider, RiderInput } from '../race/types'
import { curveAt } from '../track/pose'
import { COP_ATTACKS_PER_SECOND, MATCH_GAIN } from './constants'

const IDLE: RiderInput = { throttle: 0, brake: 1, steer: 0, punch: false, kick: false }
const FIGHT_GAP = 6 // m: daqui para perto encosta do lado em vez de seguir atrás

// Policial: espera parado, depois persegue o jogador, encosta do lado e bate com o cassetete.
// A velocidade alvo é a do jogador mais um tanto pela distância: longe, acelera tudo; com o
// jogador caído, para do lado dele.
export function copInput(cop: Rider, race: Race, dt: number): RiderInput {
  if (!cop.chasing) return IDLE
  const player = race.riders[race.playerId]
  const gap = player.s - cop.s
  const goal = clamp(player.speed + chaseGap(gap) * MATCH_GAIN, 0, MAX_SPEED * cop.speedFactor)
  const wanted = Math.abs(gap) < FIGHT_GAP ? besideLine(cop, player) : player.x
  const lineX = dodgeLine(cop, wanted, race.cars) ?? wanted
  const swing = wantsToSwing(cop, player, race, dt)
  return {
    throttle: cop.speed < goal ? 1 : 0,
    brake: cop.speed > goal + 2 ? 0.7 : 0,
    steer: steerToward(cop, lineX, curveAt(race.track, cop.s)),
    punch: swing,
    kick: false,
  }
}

// Colado no jogador, nunca anda mais devagar que ele: senão a moto da frente (o policial)
// seguraria a de trás até parar, e o jogador seria preso sem ter caído.
function chaseGap(gap: number): number {
  return gap > -FIGHT_GAP ? Math.max(gap, 0) : gap
}

function wantsToSwing(cop: Rider, player: Rider, race: Race, dt: number): boolean {
  if (cop.attack || cop.cooldown > 0 || player.crashTimer > 0) return false
  return inReach(cop, player, 'punch') && race.rng() < COP_ATTACKS_PER_SECOND * dt
}
