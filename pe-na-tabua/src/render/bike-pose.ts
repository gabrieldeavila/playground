import { ATTACKS } from '../domain/race/attacks'
import { CRASH_TIME } from '../domain/race/constants'
import type { Attack, Rider } from '../domain/race/types'
import { poseAt } from '../domain/track/pose'
import type { Track } from '../domain/track/types'
import { type BikeModel, WHEEL_RADIUS } from './bike-model'

const MAX_LEAN = 0.45
const ARM_REST = -0.76 // braço descendo até o guidão
const HIP_REST = -0.35
const KNEE_REST = 0.35

// Copia o estado do piloto para o modelo 3D. Sem estado próprio: só lê o domínio.
export function poseBike(model: BikeModel, rider: Rider, track: Track): void {
  const pose = poseAt(track, rider.s, rider.x)
  model.root.position.set(pose.x, pose.y, pose.z)
  model.root.rotation.set(pose.pitch, -pose.heading, 0, 'YXZ')
  for (const wheel of model.wheels) wheel.rotation.x = -rider.s / WHEEL_RADIUS
  restLimbs(model)
  if (rider.crashTimer > 0) return poseCrash(model, rider)
  model.lean.rotation.z = -rider.steer * MAX_LEAN
  if (rider.attack) poseAttack(model, rider.attack)
}

function restLimbs(model: BikeModel): void {
  for (const arm of model.arms) arm.rotation.set(ARM_REST, 0, 0)
  for (const hip of model.hips) hip.rotation.set(HIP_REST, 0, 0)
  for (const knee of model.knees) knee.rotation.set(KNEE_REST, 0, 0)
}

// Soco abre o braço para o lado; chute estica a perna para o lado.
function poseAttack(model: BikeModel, attack: Attack): void {
  const progress = Math.min(1, attack.elapsed / ATTACKS[attack.kind].duration)
  const swing = Math.sin(progress * Math.PI)
  const limb = attack.side === 1 ? 1 : 0
  if (attack.kind === 'punch') {
    model.arms[limb].rotation.set(ARM_REST * (1 - swing), -attack.side * 1.45 * swing, 0)
    return
  }
  model.hips[limb].rotation.set(HIP_REST * (1 - swing), -attack.side * 1.3 * swing, 0)
  model.knees[limb].rotation.x = KNEE_REST + 1.2 * swing
}

// Moto deitada derrapando de lado, e se levantando no final.
function poseCrash(model: BikeModel, rider: Rider): void {
  const t = 1 - rider.crashTimer / CRASH_TIME
  const down = smoothstep(0, 0.15, t) * (1 - smoothstep(0.85, 1, t))
  model.lean.rotation.z = -rider.crashSide * 1.35 * down
  model.root.rotation.y += rider.crashSide * 0.6 * down
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
