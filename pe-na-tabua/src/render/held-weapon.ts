import { type Group, Mesh } from 'three'
import { ATTACKS, usesArm } from '../domain/race/attacks'
import type { Attack, Side, WeaponKind } from '../domain/race/types'
import { createWeaponGeometry, createWeaponMaterial } from './weapon-model'

const KINDS: WeaponKind[] = ['club', 'chain']

// Gira a arma dentro da mão. `swing` vai de 0 (em repouso) a 1 (auge do golpe).
export type OrientWeapon = (mesh: Mesh, side: Side, swing: number) => void

// Arma na mão: na direita por padrão, na mão do lado do golpe quando ataca.
export class HeldWeapon {
  private readonly meshes: Record<WeaponKind, Mesh>

  constructor(
    private readonly hands: [Group, Group],
    private readonly orient: OrientWeapon,
    scale = 1,
  ) {
    const material = createWeaponMaterial()
    const mesh = (kind: WeaponKind) => {
      const m = new Mesh(createWeaponGeometry(kind), material)
      m.scale.setScalar(scale)
      m.castShadow = true
      return m
    }
    this.meshes = { club: mesh('club'), chain: mesh('chain') }
  }

  pose(weapon: WeaponKind | null, attack: Attack | null, visible: boolean): void {
    const swinging = attack && usesArm(attack.kind) ? attack : null
    const side: Side = swinging?.side ?? 1
    const swing = swinging ? Math.sin(Math.min(1, swinging.elapsed / ATTACKS[swinging.kind].duration) * Math.PI) : 0
    for (const kind of KINDS) {
      const mesh = this.meshes[kind]
      mesh.visible = visible && weapon === kind
      if (!mesh.visible) continue
      const hand = this.hands[side === 1 ? 1 : 0]
      if (mesh.parent !== hand) hand.add(mesh)
      this.orient(mesh, side, swing)
    }
  }
}
