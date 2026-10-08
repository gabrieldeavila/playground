import type { Race } from '../domain/race/types'
import { propsPassed } from '../domain/track/props-passed'
import { carVelocity } from '../domain/traffic/step-traffic'
import { HEARING_RANGE } from './levels'

export type PassSound = 'prop' | 'overhead' | 'vehicle'

export interface PassBy {
  lateral: number // deslocamento em relação ao jogador (m). Positivo = direita
  speed: number // velocidade relativa (m/s)
  sound: PassSound
}

// Pulo maior que isso entre quadros é um carro dando a volta na pista, não uma ultrapassagem.
const MAX_CROSS_GAP = 50

// O que acabou de passar pelo jogador: objetos da beira, motos e carros (nos dois sentidos).
export class PassBys {
  private lastS: number | null = null
  private riderGaps = new Map<number, number>()
  private carGaps = new Map<number, number>()

  reset(): void {
    this.lastS = null
    this.riderGaps.clear()
    this.carGaps.clear()
  }

  take(race: Race): PassBy[] {
    const player = race.riders[race.playerId]
    const found: PassBy[] = []
    if (this.lastS !== null && player.s > this.lastS) {
      for (const prop of propsPassed(race.track, this.lastS, player.s)) {
        // Guard-rail tem um lance a cada 4 m: viraria um chiado contínuo.
        if (prop.kind === 'rail') continue
        const lateral = prop.x - player.x
        if (prop.kind === 'gantry') found.push({ lateral, speed: player.speed, sound: 'overhead' })
        else if (Math.abs(lateral) < HEARING_RANGE) found.push({ lateral, speed: player.speed, sound: 'prop' })
      }
    }
    for (const rider of race.riders) {
      if (rider.id === player.id || !crossed(this.riderGaps, rider.id, rider.s - player.s)) continue
      found.push({ lateral: rider.x - player.x, speed: Math.abs(player.speed - rider.speed), sound: 'prop' })
    }
    for (const car of race.cars) {
      const lateral = car.x - player.x
      if (!crossed(this.carGaps, car.id, car.s - player.s) || Math.abs(lateral) >= HEARING_RANGE) continue
      found.push({ lateral, speed: Math.abs(player.speed - carVelocity(car)), sound: 'vehicle' })
    }
    this.lastS = player.s
    return found
  }
}

// Guarda a distância nova e diz se ela trocou de sinal (alguém passou pelo jogador).
function crossed(gaps: Map<number, number>, id: number, gap: number): boolean {
  const before = gaps.get(id)
  gaps.set(id, gap)
  if (before === undefined || Math.abs(before - gap) > MAX_CROSS_GAP) return false
  return before < 0 !== gap < 0
}
