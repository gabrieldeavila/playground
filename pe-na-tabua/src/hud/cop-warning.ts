import { nearestChasingCop } from '../domain/police/nearest-cop'
import type { Race } from '../domain/race/types'

export const WARNING_RANGE = 150 // m

// "POLICE ▲ 85 M": seta para onde o policial está (à frente ou atrás).
export function copWarningText(gap: number): string {
  return `POLICE ${gap >= 0 ? '▲' : '▼'} ${Math.round(Math.abs(gap))} M`
}

// Aviso piscando quando um policial perseguindo está perto.
export class CopWarning {
  constructor(private readonly el: HTMLElement) {}

  update(race: Race): void {
    const sighting = race.phase === 'racing' ? nearestChasingCop(race, WARNING_RANGE) : null
    this.el.hidden = !sighting
    if (sighting) this.el.textContent = copWarningText(sighting.gap)
  }
}
