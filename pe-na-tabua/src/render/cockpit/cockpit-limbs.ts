import { BoxGeometry, Group, type Material, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { ATTACKS, usesArm } from '../../domain/race/attacks'
import type { Attack, WeaponKind } from '../../domain/race/types'
import { HeldWeapon, type OrientWeapon } from '../held-weapon'
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
// Aqui o braço aponta para +z e sai para fora da tela: a arma dá meia volta, vira para dentro
// e sobe, para aparecer na tela. No golpe ela deita na direção do braço.
const WEAPON_INWARD = 0.64
const WEAPON_UP = -1.22
const WEAPON_SCALE = 0.8
const orientWeapon: OrientWeapon = (mesh, side, swing) =>
  mesh.rotation.set(WEAPON_UP * (1 - swing), Math.PI + side * WEAPON_INWARD * (1 - swing), 0)

interface Limb {
  pivot: Group
  rest: Quaternion
  strike: Quaternion
  reach: number // quanto o membro estica no auge do golpe
}

interface Arm extends Limb {
  hand: Group // ponta da luva, onde vai a arma
}

// Braços nas manoplas; no soco (ou golpe de arma) o braço sai para o lado, no chute a perna sobe de baixo.
export class CockpitLimbs {
  readonly group = new Group()
  private readonly arms: [Arm, Arm]
  private readonly legs: [Limb, Limb]
  private readonly weapon: HeldWeapon

  constructor(colors: RiderColors) {
    const jacket = new MeshStandardMaterial({ color: colors.jacket, roughness: 0.7 })
    const pants = new MeshStandardMaterial({ color: colors.pants, roughness: 0.8 })
    const leather = new MeshStandardMaterial({ color: '#1d1f24', roughness: 0.55 })
    this.arms = [createArm(-1, jacket, leather), createArm(1, jacket, leather)]
    this.legs = [createLeg(-1, pants, leather), createLeg(1, pants, leather)]
    this.group.add(...[...this.arms, ...this.legs].map((limb) => limb.pivot))
    this.weapon = new HeldWeapon([this.arms[0].hand, this.arms[1].hand], orientWeapon, WEAPON_SCALE)
  }

  pose(attack: Attack | null, weapon: WeaponKind | null): void {
    this.weapon.pose(weapon, attack, true)
    for (const limb of [...this.arms, ...this.legs]) {
      limb.pivot.quaternion.copy(limb.rest)
      limb.pivot.scale.set(1, 1, 1)
    }
    if (!attack) return
    const swing = Math.sin(Math.min(1, attack.elapsed / ATTACKS[attack.kind].duration) * Math.PI)
    const limb = (usesArm(attack.kind) ? this.arms : this.legs)[attack.side === 1 ? 1 : 0]
    limb.pivot.quaternion.slerpQuaternions(limb.rest, limb.strike, swing)
    // Só o soco estica o braço; com arma na mão quem alcança é a arma.
    if (attack.kind === 'punch') limb.pivot.scale.z = 1 + (limb.reach - 1) * swing
  }
}

function createArm(side: -1 | 1, jacket: Material, glove: Material): Arm {
  const shoulder = mirror(SHOULDER, side)
  const toGrip = mirror(GRIP, side).sub(shoulder)
  const length = toGrip.length()
  const pivot = new Group()
  pivot.position.copy(shoulder)
  const hand = new Group()
  hand.position.z = length
  pivot.add(alongZ(new BoxGeometry(0.07, 0.07, length), jacket, length / 2), alongZ(new BoxGeometry(0.08, 0.065, 0.1), glove, length), hand)
  return { pivot, rest: aim(toGrip), strike: aim(mirror(PUNCH_DIRECTION, side)), reach: 1.5, hand }
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
