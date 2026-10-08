import type { AttackKind, Race, RaceEvent } from '../domain/race/types'
import { ordinal } from './format-time'

const HIT_TEXT: Record<AttackKind, string> = { punch: 'PUNCH!', kick: 'KICK!', club: 'WHACK!', chain: 'CHAIN!' }

// Texto de destaque para eventos que envolvem o jogador; null para os outros.
export function describeEvent(event: RaceEvent, race: Race): string | null {
  const me = race.playerId
  const name = (id: number) => race.riders[id].name.toUpperCase()
  switch (event.kind) {
    case 'hit':
      return event.attackerId === me ? HIT_TEXT[event.attack] : null
    case 'disarm':
      if (event.attackerId === me) return `GOT A ${event.weapon.toUpperCase()}!`
      return event.targetId === me ? `LOST YOUR ${event.weapon.toUpperCase()}!` : null
    case 'knockout':
      if (event.targetId === me) return 'KNOCKED OFF!'
      return event.attackerId === me ? `${name(event.targetId)} IS DOWN!` : null
    case 'crash':
      if (event.riderId !== me) return null
      return event.car ? `HIT A ${event.car === 'taxi' ? 'TAXI' : 'CAR'}!` : 'WIPEOUT!'
    case 'finish':
      return event.riderId === me ? `FINISHED ${ordinal(event.place).toUpperCase()}` : null
  }
}

export function hurtsPlayer(event: RaceEvent, race: Race): boolean {
  if (event.kind === 'hit' || event.kind === 'knockout') return event.targetId === race.playerId
  return event.kind === 'crash' && event.riderId === race.playerId
}
