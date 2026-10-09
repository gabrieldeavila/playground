import { clamp } from '../math'
import type { Race } from './types'

const START_GAP = 40 // m atrás do líder em que a ajuda começa
const FULL_GAP = 200 // m atrás do líder com a ajuda toda

// Multiplica a velocidade máxima do jogador quando ele fica para trás (só no modo fácil).
export function catchUpBoost(race: Race): number {
  if (race.rules.catchUp === 0) return 1
  const player = race.riders[race.playerId]
  const leader = Math.max(...race.riders.filter((r) => r.role === 'racer').map((r) => r.s))
  return 1 + race.rules.catchUp * clamp((leader - player.s - START_GAP) / (FULL_GAP - START_GAP), 0, 1)
}
