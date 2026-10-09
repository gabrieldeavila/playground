import { BoxGeometry, Mesh, MeshStandardMaterial, type Object3D } from 'three'

const BLINK_HZ = 1.6 // piscadas por segundo
const geometry = new BoxGeometry(0.14, 0.12, 0.06)
const material = new MeshStandardMaterial({ color: '#ffb020', emissive: '#ff9a10', emissiveIntensity: 3 })

// Pisca-pisca de um carro: uma luz âmbar na frente e outra atrás de cada lado (frente = -z).
export class CarBlinkers {
  private readonly left: Mesh[]
  private readonly right: Mesh[]

  constructor(car: Object3D) {
    this.left = this.place(car, -1)
    this.right = this.place(car, 1)
  }

  // `side` no espaço do carro: 1 = direita dele, 0 = apagado.
  update(side: -1 | 0 | 1, time: number): void {
    const on = Math.floor(time * BLINK_HZ * 2) % 2 === 0
    for (const light of this.left) light.visible = on && side === -1
    for (const light of this.right) light.visible = on && side === 1
  }

  private place(car: Object3D, side: -1 | 1): Mesh[] {
    return [-2.23, 2.23].map((z) => {
      const light = new Mesh(geometry, material)
      light.position.set(side * 0.84, 0.78, z)
      light.visible = false
      car.add(light)
      return light
    })
  }
}
