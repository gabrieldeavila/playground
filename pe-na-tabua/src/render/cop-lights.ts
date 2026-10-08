import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

const FLASH_HZ = 3
const ON = 4
const OFF = 0.15

// Giroflex na traseira da moto da polícia: vermelho e azul alternando enquanto persegue.
export class CopLights {
  readonly group = new Group()
  private readonly red = new MeshStandardMaterial({ color: '#ff2a1f', emissive: '#ff2a1f', emissiveIntensity: OFF })
  private readonly blue = new MeshStandardMaterial({ color: '#2a5bff', emissive: '#2a5bff', emissiveIntensity: OFF })

  constructor() {
    this.group.position.set(0, 1.12, 0.8)
    const lamp = (material: MeshStandardMaterial, x: number) => {
      const mesh = new Mesh(new BoxGeometry(0.14, 0.09, 0.09), material)
      mesh.position.x = x
      return mesh
    }
    const bar = new Mesh(new BoxGeometry(0.42, 0.04, 0.08), new MeshStandardMaterial({ color: '#202226' }))
    bar.position.y = -0.06
    this.group.add(bar, lamp(this.red, -0.12), lamp(this.blue, 0.12))
  }

  update(time: number, on: boolean): void {
    const redTurn = Math.floor(time * FLASH_HZ * 2) % 2 === 0
    this.red.emissiveIntensity = on && redTurn ? ON : OFF
    this.blue.emissiveIntensity = on && !redTurn ? ON : OFF
  }
}
