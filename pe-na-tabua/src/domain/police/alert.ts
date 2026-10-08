import type { Race, RaceEvent } from '../race/types'
import { ALERT_RANGE } from './constants'

// Policial parado sai atrás do jogador quando ele chega perto.
export function alertCops(race: Race): RaceEvent[] {
  const player = race.riders[race.playerId]
  const events: RaceEvent[] = []
  for (const cop of race.riders) {
    if (cop.role !== 'cop' || cop.chasing || player.s < cop.s - ALERT_RANGE) continue
    cop.chasing = true
    events.push({ kind: 'chase', copId: cop.id })
  }
  return events
}
