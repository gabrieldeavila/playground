import { ConeGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { lerp } from '../domain/math'
import { createRng } from '../domain/random'
import type { BackdropStyle } from './theme/theme'

const COUNT = 48
const BASE_Y = -40

// Anel de montanhas (ou ilhas) distantes que acompanha a câmera (sem neblina, sempre no horizonte).
export function createBackdrop(style: BackdropStyle): Group {
  const group = new Group()
  const rng = createRng(99)
  const between = ([min, max]: [number, number]) => lerp(min, max, rng())
  const materials = style.colors.map((color) => new MeshStandardMaterial({ color, flatShading: true, fog: false, roughness: 1 }))
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2 + rng() * 0.1
    const distance = between(style.distance)
    const height = between(style.height)
    const geometry = new ConeGeometry(between(style.radius), height, 5 + Math.floor(rng() * 3))
    const mountain = new Mesh(geometry, materials[i % materials.length])
    mountain.position.set(Math.cos(angle) * distance, height / 2, Math.sin(angle) * distance)
    mountain.rotation.y = rng() * Math.PI
    group.add(mountain)
  }
  return group
}

export function followBackdrop(backdrop: Group, cameraX: number, cameraZ: number): void {
  backdrop.position.set(cameraX, BASE_Y, cameraZ)
}
