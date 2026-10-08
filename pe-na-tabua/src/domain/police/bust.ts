import type { Race, Rider } from '../race/types'
import { BUST_RANGE_S, BUST_RANGE_X, BUST_SPEED, BUST_TIME } from './constants'

// Conta o tempo com um policial em cima do jogador caído ou parado; devolve quem prendeu.
export function stepBust(race: Race, dt: number): Rider | null {
  const player = race.riders[race.playerId]
  const cop = player.finishTime === null ? copOnTopOf(player, race.riders) : null
  race.bustTimer = cop ? race.bustTimer + dt : 0
  return cop && race.bustTimer >= BUST_TIME ? cop : null
}

function copOnTopOf(player: Rider, riders: Rider[]): Rider | null {
  const helpless = player.crashTimer > 0 || player.speed < BUST_SPEED
  if (!helpless) return null
  return (
    riders.find(
      (r) =>
        r.role === 'cop' &&
        r.chasing &&
        r.crashTimer <= 0 &&
        Math.abs(r.s - player.s) < BUST_RANGE_S &&
        Math.abs(r.x - player.x) < BUST_RANGE_X,
    ) ?? null
  )
}
