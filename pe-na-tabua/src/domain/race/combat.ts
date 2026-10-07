import { ATTACKS, type AttackSpec } from './attacks'
import { knockOff } from './crash'
import type { AttackKind, RaceEvent, Rider, Side } from './types'

export function startAttack(rider: Rider, kind: AttackKind, riders: Rider[]): void {
  if (rider.attack || rider.cooldown > 0 || rider.crashTimer > 0 || rider.finishTime !== null) return
  const target = nearestOpponent(rider, riders, 4)
  rider.attack = { kind, side: sideToward(rider, target), elapsed: 0, landed: false }
}

// Piloto de pé mais próximo dentro de `range` metros.
export function nearestOpponent(rider: Rider, riders: Rider[], range: number): Rider | null {
  let best: Rider | null = null
  let bestDistance = range
  for (const other of riders) {
    if (other === rider || other.crashTimer > 0) continue
    const distance = Math.hypot(other.s - rider.s, other.x - rider.x)
    if (distance < bestDistance) {
      best = other
      bestDistance = distance
    }
  }
  return best
}

// Anda o golpe em curso; no instante do impacto, testa quem foi atingido.
export function stepAttack(rider: Rider, riders: Rider[], dt: number): RaceEvent[] {
  const attack = rider.attack
  if (!attack) {
    rider.cooldown = Math.max(0, rider.cooldown - dt)
    return []
  }
  const spec = ATTACKS[attack.kind]
  attack.elapsed += dt
  const events: RaceEvent[] = []
  if (!attack.landed && attack.elapsed >= spec.impactAt) {
    attack.landed = true
    const target = findTarget(rider, attack.side, spec, riders)
    if (target) events.push(landHit(rider, target, attack.kind, attack.side))
  }
  if (attack.elapsed >= spec.duration) {
    rider.attack = null
    rider.cooldown = spec.cooldown
  }
  return events
}

function sideToward(rider: Rider, target: Rider | null): Side {
  if (target) return target.x < rider.x ? -1 : 1
  return rider.steer < -0.2 ? -1 : 1
}

function findTarget(rider: Rider, side: Side, spec: AttackSpec, riders: Rider[]): Rider | null {
  let best: Rider | null = null
  let bestReach = spec.reachX
  for (const other of riders) {
    if (other === rider || other.crashTimer > 0) continue
    const lateral = side * (other.x - rider.x)
    if (Math.abs(other.s - rider.s) > spec.reachS || lateral < 0.2 || lateral > bestReach) continue
    best = other
    bestReach = lateral
  }
  return best
}

function landHit(attacker: Rider, target: Rider, kind: AttackKind, side: Side): RaceEvent {
  const spec = ATTACKS[kind]
  target.health = Math.max(0, target.health - spec.damage)
  target.pushVel = side * spec.push
  target.speed *= spec.slow
  if (target.health > 0) return { kind: 'hit', attackerId: attacker.id, targetId: target.id, attack: kind }
  knockOff(target, side)
  return { kind: 'knockout', attackerId: attacker.id, targetId: target.id }
}
