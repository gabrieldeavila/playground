import type { RiderSetup } from '../race/roster'
import type { AiProfile, WeaponKind } from '../race/types'
import type { Challenge } from './challenge'

// Arma para quem não tem uma no roster, alternando pela ordem de agressividade.
const SPARE_WEAPONS: WeaponKind[] = ['club', 'chain']

// Bots mais rápidos ou mais lentos, mais ou menos bravos; os N mais agressivos largam armados.
// O jogador fica como está.
export function levelRoster(roster: RiderSetup[], challenge: Challenge): RiderSetup[] {
  const armed = mostAggressive(roster, challenge.armedBots)
  return roster.map((setup) => {
    if (!setup.ai) return setup
    const rank = armed.indexOf(setup)
    return { ...setup, ai: adjust(setup.ai, challenge), weapon: rank < 0 ? undefined : (setup.weapon ?? SPARE_WEAPONS[rank % SPARE_WEAPONS.length]) }
  })
}

function adjust(ai: AiProfile, challenge: Challenge): AiProfile {
  return { ...ai, pace: within01(ai.pace + challenge.botPace), aggression: within01(ai.aggression + challenge.botAggression) }
}

const within01 = (value: number) => Math.min(1, Math.max(0, value))

function mostAggressive(roster: RiderSetup[], count: number): RiderSetup[] {
  return roster
    .filter((setup) => setup.ai)
    .sort((a, b) => b.ai!.aggression - a.ai!.aggression)
    .slice(0, count)
}
