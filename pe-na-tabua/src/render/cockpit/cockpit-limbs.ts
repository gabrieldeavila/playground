import { BoxGeometry, Group, type Material, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { ATTACKS } from '../../domain/race/attacks'
import type { Attack } from '../../domain/race/types'
import type { RiderColors } from '../rider-colors'

// Posições do lado direito; o esquerdo é espelhado em x.
const SHOULDER = new Vector3(0.3, 0.05, 0.45)
const GRIP = new Vector3(0.57, 0.05, 0.06)
const PUNCH_DIRECTION = new Vector3(0.2, 0.35, -0.9)
const HIP = new Vector3(0.25, -0.3, 0.3)
const LEG_REST_DIRECTION = new Vector3(0, -1, 0.1)
const KICK_DIRECTION = new Vector3(0.45, 0.55, -0.7)
const LEG_LENGTH = 0.8
const FORWARD = new Vector3(0, 0, 1)

interface Limb {
  pivot: Group
  rest: Quaternion
  strike: Quaternion
  reach: number // quanto o membro estica no auge do golpe
}

// Braços nas manoplas; no soco o braço sai para o lado, no chute a perna sobe de baixo.
export class CockpitLimbs {
  readonly group = new Group()
  private readonly arms: [Limb, Limb]
  private readonly legs: [Limb, Limb]

  constructor(colors: RiderColors) {
    const jacket = new MeshStandardMaterial({ color: colors.jacket, roughness: 0.7 })
    const pants = new MeshStandardMaterial({ color: colors.pants, roughness: 0.8 })
    const leather = new MeshStandardMaterial({ color: '#1d1f24', roughness: 0.55 })
    this.arms = [createArm(-1, jacket, leather), createArm(1, jacket, leather)]
    this.legs = [createLeg(-1, pants, leather), createLeg(1, pants, leather)]
    this.group.add(...[...this.arms, ...this.legs].map((limb) => limb.pivot))
  }

  pose(attack: Attack | null): void {
    for (const limb of [...this.arms, ...this.legs]) {
      limb.pivot.quaternion.copy(limb.rest)
      limb.pivot.scale.set(1, 1, 1)
    }
    if (!attack) return
    const swing = Math.sin(Math.min(1, attack.elapsed / ATTACKS[attack.kind].duration) * Math.PI)
    const limb = (attack.kind === 'punch' ? this.arms : this.legs)[attack.side === 1 ? 1 : 0]
    limb.pivot.quaternion.slerpQuaternions(limb.rest, limb.strike, swing)
    limb.pivot.scale.z = 1 + (limb.reach - 1) * swing
  }
}

function createArm(side: -1 | 1, jacket: Material, glove: Material): Limb {
  const shoulder = mirror(SHOULDER, side)
  const toGrip = mirror(GRIP, side).sub(shoulder)
  const length = toGrip.length()
  const pivot = new Group()
  pivot.position.copy(shoulder)
  pivot.add(alongZ(new BoxGeometry(0.07, 0.07, length), jacket, length / 2), alongZ(new BoxGeometry(0.08, 0.065, 0.1), glove, length))
  return { pivot, rest: aim(toGrip), strike: aim(mirror(PUNCH_DIRECTION, side)), reach: 1.5 }
}

function createLeg(side: -1 | 1, pants: Material, boot: Material): Limb {
  const pivot = new Group()
  pivot.position.copy(mirror(HIP, side))
  pivot.add(alongZ(new BoxGeometry(0.1, 0.1, LEG_LENGTH), pants, LEG_LENGTH / 2), alongZ(new BoxGeometry(0.1, 0.12, 0.2), boot, LEG_LENGTH))
  return { pivot, rest: aim(LEG_REST_DIRECTION), strike: aim(mirror(KICK_DIRECTION, side)), reach: 1 }
}

function alongZ(geometry: BoxGeometry, material: Material, z: number): Mesh {
  const mesh = new Mesh(geometry, material)
  mesh.position.z = z
  return mesh
}

function aim(direction: Vector3): Quaternion {
  return new Quaternion().setFromUnitVectors(FORWARD, direction.clone().normalize())
}

function mirror(v: Vector3, side: -1 | 1): Vector3 {
  return new Vector3(v.x * side, v.y, v.z)
}
