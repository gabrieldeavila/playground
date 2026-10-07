import type { AttackKind } from './types'

export interface AttackSpec {
  duration: number
  impactAt: number // momento do golpe em que o acerto é testado (s)
  reachS: number // alcance para frente/trás (m)
  reachX: number // alcance para o lado (m)
  damage: number
  push: number // empurrão lateral no alvo (m/s)
  slow: number // multiplica a velocidade do alvo
  cooldown: number
}

export const ATTACKS: Record<AttackKind, AttackSpec> = {
  punch: { duration: 0.32, impactAt: 0.14, reachS: 1.8, reachX: 1.7, damage: 8, push: 3.5, slow: 0.97, cooldown: 0.2 },
  kick: { duration: 0.5, impactAt: 0.24, reachS: 2.2, reachX: 2.0, damage: 14, push: 6, slow: 0.94, cooldown: 0.4 },
}
