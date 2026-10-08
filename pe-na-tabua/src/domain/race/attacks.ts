import type { AttackKind, Move, Rider } from './types'

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

// Arma alcança mais longe e machuca mais, mas o golpe é mais lento.
export const ATTACKS: Record<AttackKind, AttackSpec> = {
  punch: { duration: 0.32, impactAt: 0.14, reachS: 1.8, reachX: 1.7, damage: 8, push: 3.5, slow: 0.97, cooldown: 0.2 },
  kick: { duration: 0.5, impactAt: 0.24, reachS: 2.2, reachX: 2.0, damage: 14, push: 6, slow: 0.94, cooldown: 0.4 },
  club: { duration: 0.42, impactAt: 0.2, reachS: 2.2, reachX: 2.4, damage: 18, push: 5, slow: 0.92, cooldown: 0.35 },
  chain: { duration: 0.5, impactAt: 0.24, reachS: 2.6, reachX: 3.0, damage: 14, push: 4, slow: 0.94, cooldown: 0.45 },
}

// O soco sai com a arma que o piloto estiver segurando.
export function attackFor(rider: Rider, move: Move): AttackKind {
  return move === 'punch' ? (rider.weapon ?? 'punch') : 'kick'
}

// O golpe alcança o alvo? (um pouco antes do limite, para o bot não errar)
export function inReach(rider: Rider, foe: Rider, move: Move): boolean {
  const spec = ATTACKS[attackFor(rider, move)]
  return Math.abs(foe.s - rider.s) <= spec.reachS * 0.9 && Math.abs(foe.x - rider.x) <= spec.reachX * 0.9
}

// Golpes dados com o braço (soco ou arma); o chute é a perna.
export const usesArm = (kind: AttackKind) => kind !== 'kick'
