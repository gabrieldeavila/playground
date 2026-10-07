import type { Scene, Vector3 } from 'three'
import type { Race, Rider } from '../domain/race/types'
import { type BikeModel, createBikeModel } from '../render/bike-model'
import { poseBike } from '../render/bike-pose'
import { riderColors } from '../render/rider-colors'

// Uma moto 3D por piloto, reposicionada a cada quadro.
export class RidersView {
  private readonly models: BikeModel[]

  constructor(scene: Scene, riders: Rider[]) {
    this.models = riders.map((rider, i) => createBikeModel(riderColors(i, rider.ai === null)))
    scene.add(...this.models.map((m) => m.root))
  }

  update(race: Race): void {
    race.riders.forEach((rider, i) => poseBike(this.models[i], rider, race.track))
  }

  positionOf(riderId: number): Vector3 {
    return this.models[riderId].root.position
  }
}
