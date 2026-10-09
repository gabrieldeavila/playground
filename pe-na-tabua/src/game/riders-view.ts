import type { Scene, Vector3 } from 'three'
import type { Race, Rider } from '../domain/race/types'
import { type BikeModel, createBikeModel } from '../render/bike-model'
import { poseBike } from '../render/bike-pose'
import { CopLights } from '../render/cop-lights'
import { disposeTree } from '../render/dispose-tree'
import { HeldWeapon, type OrientWeapon } from '../render/held-weapon'
import { riderColors } from '../render/rider-colors'

// O braço já desce até o guidão: inclina bastante para a arma ficar em pé, e abre para fora
// para aparecer por trás do capacete. No golpe ela deita e vira continuação do braço.
const WEAPON_REST_TILT = 1.9
const WEAPON_REST_OUT = 0.6
const orientWeapon: OrientWeapon = (mesh, side, swing) =>
  mesh.rotation.set(WEAPON_REST_TILT * (1 - swing), -side * WEAPON_REST_OUT * (1 - swing), 0)

// Uma moto 3D por piloto, reposicionada a cada quadro. Se o grid mudar (outro nível,
// mais policiais), refaz as motos.
export class RidersView {
  private models: BikeModel[] = []
  private weapons: HeldWeapon[] = []
  private readonly copLights = new Map<number, CopLights>()
  private lineup = ''

  constructor(
    private readonly scene: Scene,
    riders: Rider[],
  ) {
    this.rebuild(riders)
  }

  update(race: Race): void {
    if (lineupOf(race.riders) !== this.lineup) this.rebuild(race.riders)
    race.riders.forEach((rider, i) => {
      poseBike(this.models[i], rider, race.track)
      this.weapons[i].pose(rider.weapon, rider.attack, rider.crashTimer <= 0)
      this.copLights.get(rider.id)?.update(race.time, rider.chasing)
    })
  }

  setVisible(riderId: number, visible: boolean): void {
    this.models[riderId].root.visible = visible
  }

  positionOf(riderId: number): Vector3 {
    return this.models[riderId].root.position
  }

  private rebuild(riders: Rider[]): void {
    for (const model of this.models) {
      this.scene.remove(model.root)
      disposeTree(model.root)
    }
    this.copLights.clear()
    this.models = riders.map((rider, i) => createBikeModel(riderColors(i, rider.ai === null, rider.role === 'cop')))
    this.weapons = this.models.map((model) => new HeldWeapon(model.hands, orientWeapon))
    riders.forEach((rider, i) => {
      if (rider.role !== 'cop') return
      const lights = new CopLights()
      this.models[i].lean.add(lights.group)
      this.copLights.set(rider.id, lights)
    })
    this.scene.add(...this.models.map((m) => m.root))
    this.lineup = lineupOf(riders)
  }
}

// Quem é quem no grid: o que decide cor, giroflex e quantas motos existem.
function lineupOf(riders: Rider[]): string {
  return riders.map((r) => (r.ai === null ? 'you' : r.role)).join(',')
}
