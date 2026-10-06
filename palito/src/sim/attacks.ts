import type { AttackKind, Fighter } from './types'

export interface AttackSpec {
  // Duração das fases, em ticks.
  startup: number
  active: number
  recovery: number
  damage: number
  // Ponto de acerto relativo ao lutador: à frente (reach) e acima dos pés (height).
  reach: number
  height: number
  knockback: number
  hitStun: number
  blockStun: number
}

// Soco é alto (passa por cima de quem agacha); chute é baixo (pula-se por cima).
export const ATTACKS: Record<AttackKind, AttackSpec> = {
  punch: {
    startup: 5,
    active: 3,
    recovery: 9,
    damage: 6,
    reach: 58,
    height: 108,
    knockback: 3,
    hitStun: 14,
    blockStun: 8,
  },
  kick: {
    startup: 9,
    active: 4,
    recovery: 16,
    damage: 11,
    reach: 78,
    height: 55,
    knockback: 7,
    hitStun: 20,
    blockStun: 12,
  },
}

export function attackDuration(spec: AttackSpec): number {
  return spec.startup + spec.active + spec.recovery
}

export function isActive(spec: AttackSpec, tick: number): boolean {
  return tick >= spec.startup && tick < spec.startup + spec.active
}

// Golpes agachados acertam mais baixo, mas são mais curtos e mais fracos:
// agachar desvia de soco, mas não pode ser a resposta para tudo.
export const CROUCH_ATTACK = { height: 0.65, reach: 0.8, damage: 0.6 }

// Onde o golpe acerta, em coordenadas da arena.
export function attackPoint(f: Fighter, kind: AttackKind): { x: number; y: number } {
  const spec = ATTACKS[kind]
  const reach = spec.reach * (f.crouching ? CROUCH_ATTACK.reach : 1)
  const height = spec.height * (f.crouching ? CROUCH_ATTACK.height : 1)
  return { x: f.x + f.facing * reach, y: f.y - height }
}

export function attackDamage(f: Fighter, kind: AttackKind): number {
  return Math.round(ATTACKS[kind].damage * (f.crouching ? CROUCH_ATTACK.damage : 1))
}
