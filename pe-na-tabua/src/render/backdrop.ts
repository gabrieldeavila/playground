import { BoxGeometry, type BufferGeometry, ConeGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { lerp } from '../domain/math'
import { createRng } from '../domain/random'
import type { BackdropStyle } from './theme/theme'

const COUNT = 48
const TOWER_COUNT = 140 // prédios são finos: precisa de mais para fechar o horizonte
const BASE_Y = -40

// Anel de montanhas, ilhas ou prédios distantes que acompanha a câmera (sem neblina, sempre no horizonte).
export function createBackdrop(style: BackdropStyle): Group {
  const group = new Group()
  const rng = createRng(99)
  const between = ([min, max]: [number, number]) => lerp(min, max, rng())
  const materials = style.colors.map((color) => new MeshStandardMaterial({ color, flatShading: true, fog: false, roughness: 1 }))
  const count = style.shape === 'towers' ? TOWER_COUNT : COUNT
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.1
    const distance = between(style.distance)
    const height = between(style.height)
    const radius = between(style.radius)
    const geometry = style.shape === 'towers' ? tower(radius, height, rng()) : new ConeGeometry(radius, height, 5 + Math.floor(rng() * 3))
    const shape = new Mesh(geometry, materials[i % materials.length])
    shape.position.set(Math.cos(angle) * distance, height / 2, Math.sin(angle) * distance)
    shape.rotation.y = rng() * Math.PI
    group.add(shape)
  }
  return group
}

function tower(radius: number, height: number, depth: number): BufferGeometry {
  return new BoxGeometry(radius * 2, height, radius * (1 + depth))
}

export function followBackdrop(backdrop: Group, cameraX: number, cameraZ: number): void {
  backdrop.position.set(cameraX, BASE_Y, cameraZ)
}
