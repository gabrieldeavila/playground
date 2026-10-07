import type { Race, RaceEvent } from '../domain/race/types'
import { ordinal } from './format-time'

// Texto de destaque para eventos que envolvem o jogador; null para os outros.
export function describeEvent(event: RaceEvent, race: Race): string | null {
  const me = race.playerId
  const name = (id: number) => race.riders[id].name.toUpperCase()
  switch (event.kind) {
    case 'hit':
      if (event.attackerId !== me) return null
      return event.attack === 'kick' ? 'KICK!' : 'PUNCH!'
    case 'knockout':
      if (event.targetId === me) return 'KNOCKED OFF!'
      return event.attackerId === me ? `${name(event.targetId)} IS DOWN!` : null
    case 'crash':
      return event.riderId === me ? 'WIPEOUT!' : null
    case 'finish':
      return event.riderId === me ? `FINISHED ${ordinal(event.place).toUpperCase()}` : null
  }
}

export function hurtsPlayer(event: RaceEvent, race: Race): boolean {
  if (event.kind === 'hit' || event.kind === 'knockout') return event.targetId === race.playerId
  return event.kind === 'crash' && event.riderId === race.playerId
}
