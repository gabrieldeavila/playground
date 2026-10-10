import { Euler, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, type Scene, Vector3 } from 'three'
import type { Race } from '../domain/race/types'
import type { Cone, Street } from '../domain/street/types'
import { poseAt } from '../domain/track/pose'
import type { Track } from '../domain/track/types'
import { createConeGeometry } from '../render/cone-model'
import { disposeTree } from '../render/dispose-tree'
import { type PedestrianModel, createPedestrianModel } from '../render/pedestrian-model'
import { posePedestrian } from '../render/pedestrian-pose'
import { createStreetMarks } from '../render/street-marks'

// Faixas de pedestres, buracos, cones e pedestres. Cada corrida sorteia a rua de novo,
// então refaz tudo quando ela muda; fora da cidade a rua vem vazia e não desenha nada.
export class StreetView {
  private group: Group | null = null
  private street: Street | null = null
  private cones: InstancedMesh | null = null
  private pedestrians: PedestrianModel[] = []
  private readonly matrix = new Matrix4()
  private readonly rotation = new Quaternion()
  private readonly euler = new Euler()
  private readonly position = new Vector3()
  private readonly scale = new Vector3(1, 1, 1)

  constructor(private readonly scene: Scene) {}

  update(race: Race, time: number): void {
    if (race.street !== this.street) this.rebuild(race.track, race.street)
    if (this.cones) {
      race.street.cones.forEach((cone, i) => this.cones!.setMatrixAt(i, this.coneMatrix(race.track, cone)))
      this.cones.instanceMatrix.needsUpdate = true
    }
    race.street.pedestrians.forEach((ped, i) => posePedestrian(this.pedestrians[i], ped, race.track, time))
  }

  private rebuild(track: Track, street: Street): void {
    if (this.group) {
      this.scene.remove(this.group)
      disposeTree(this.group)
    }
    // Material próprio de cada rua: disposeTree solta tudo junto quando ela é trocada.
    const material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 })
    this.group = new Group()
    for (const mesh of createStreetMarks(track, street)) this.group.add(mesh)
    this.cones = street.cones.length > 0 ? new InstancedMesh(createConeGeometry(), material, street.cones.length) : null
    if (this.cones) {
      this.cones.castShadow = true
      this.cones.frustumCulled = false // voam: a esfera calculada na largada não vale depois
      this.group.add(this.cones)
    }
    this.pedestrians = street.pedestrians.map((ped) => createPedestrianModel(ped.id, material))
    for (const model of this.pedestrians) this.group.add(model.root)
    this.scene.add(this.group)
    this.street = street
  }

  private coneMatrix(track: Track, cone: Cone): Matrix4 {
    const pose = poseAt(track, cone.s, cone.x)
    this.position.set(pose.x, pose.y + (cone.flight?.y ?? 0), pose.z)
    this.rotation.setFromEuler(this.euler.set(-(cone.flight?.angle ?? 0), -pose.heading, 0, 'YXZ'))
    return this.matrix.compose(this.position, this.rotation, this.scale)
  }
}
