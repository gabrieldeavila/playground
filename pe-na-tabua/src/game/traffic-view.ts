import { type BufferGeometry, Mesh, MeshStandardMaterial, type Scene } from 'three'
import type { Race } from '../domain/race/types'
import { poseAt } from '../domain/track/pose'
import type { Car } from '../domain/traffic/types'
import { carColor, createCarGeometry } from '../render/car-model'

// Um carro 3D por carro do trânsito. Cada corrida sorteia o trânsito de novo, então refaz as malhas.
export class TrafficView {
  private readonly material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.45, metalness: 0.15 })
  private readonly geometries = new Map<string, BufferGeometry>()
  private meshes: Mesh[] = []
  private cars: Car[] | null = null

  constructor(private readonly scene: Scene) {}

  update(race: Race): void {
    if (race.cars !== this.cars) this.rebuild(race.cars)
    race.cars.forEach((car, i) => {
      const mesh = this.meshes[i]
      const pose = poseAt(race.track, car.s, car.x)
      mesh.position.set(pose.x, pose.y, pose.z)
      // Na contramão o carro vira 180°, e a rampa fica invertida para ele.
      const yaw = -pose.heading + (car.direction === 1 ? 0 : Math.PI)
      mesh.rotation.set(car.direction * pose.pitch, yaw, 0, 'YXZ')
    })
  }

  private rebuild(cars: Car[]): void {
    this.scene.remove(...this.meshes)
    this.meshes = cars.map((car) => {
      const mesh = new Mesh(this.geometryFor(car), this.material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    })
    this.scene.add(...this.meshes)
    this.cars = cars
  }

  private geometryFor(car: Car): BufferGeometry {
    const color = carColor(car)
    const key = `${car.kind}:${color}`
    let geometry = this.geometries.get(key)
    if (!geometry) {
      geometry = createCarGeometry(car.kind, color)
      this.geometries.set(key, geometry)
    }
    return geometry
  }
}
