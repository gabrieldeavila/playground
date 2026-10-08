import type { Race } from '../domain/race/types'
import { propsPassed } from '../domain/track/props-passed'
import { HEARING_RANGE } from './levels'

export interface PassBy {
  lateral: number // deslocamento em relação ao jogador (m). Positivo = direita
  overhead: boolean // pórtico passando por cima
}

// O que acabou de passar pelo jogador: objetos da beira e motos ultrapassadas (nos dois sentidos).
export class PassBys {
  private lastS: number | null = null
  private gaps: number[] = []

  reset(): void {
    this.lastS = null
    this.gaps = []
  }

  take(race: Race): PassBy[] {
    const player = race.riders[race.playerId]
    const found: PassBy[] = []
    if (this.lastS !== null && player.s > this.lastS) {
      for (const prop of propsPassed(race.track, this.lastS, player.s)) {
        // Guard-rail tem um lance a cada 4 m: viraria um chiado contínuo.
        if (prop.kind === 'rail') continue
        const lateral = prop.x - player.x
        if (prop.kind === 'gantry' || Math.abs(lateral) < HEARING_RANGE) found.push({ lateral, overhead: prop.kind === 'gantry' })
      }
    }
    for (const rider of race.riders) {
      const gap = rider.s - player.s
      const before = this.gaps[rider.id]
      if (rider.id !== player.id && before !== undefined && before < 0 !== gap < 0) found.push({ lateral: rider.x - player.x, overhead: false })
      this.gaps[rider.id] = gap
    }
    this.lastS = player.s
    return found
  }
}
