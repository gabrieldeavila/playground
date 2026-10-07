import { ConeGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { createRng } from '../domain/random'

const COUNT = 48
const BASE_Y = -40

// Anel de montanhas distantes que acompanha a câmera (sem neblina, sempre no horizonte).
export function createBackdrop(): Group {
  const group = new Group()
  const rng = createRng(99)
  const materials = ['#7b7fa6', '#8f88a8', '#6f7899'].map(
    (color) => new MeshStandardMaterial({ color, flatShading: true, fog: false, roughness: 1 }),
  )
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2 + rng() * 0.1
    const distance = 1300 + rng() * 500
    const height = 140 + rng() * 260
    const geometry = new ConeGeometry(200 + rng() * 220, height, 5 + Math.floor(rng() * 3))
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
