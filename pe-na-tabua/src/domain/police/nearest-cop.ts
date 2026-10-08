import type { Race, Rider } from '../race/types'

export interface CopSighting {
  cop: Rider
  gap: number // m ao longo da pista; positivo = à frente do jogador
}

// Policial perseguindo mais perto do jogador (para o aviso na tela e a sirene).
export function nearestChasingCop(race: Race, range: number): CopSighting | null {
  const player = race.riders[race.playerId]
  let best: CopSighting | null = null
  for (const cop of race.riders) {
    if (cop.role !== 'cop' || !cop.chasing) continue
    const gap = cop.s - player.s
    if (Math.abs(gap) <= range && (!best || Math.abs(gap) < Math.abs(best.gap))) best = { cop, gap }
  }
  return best
}
