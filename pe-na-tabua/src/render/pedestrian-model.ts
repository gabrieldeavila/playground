import { BoxGeometry, type BufferGeometry, Group, Mesh, type Material } from 'three'
import { paint } from './painted-geometry'

const SHIRTS = ['#c0392b', '#2f6db3', '#e5b53b', '#2e8b57', '#8e44ad', '#ecf0f1', '#34495e', '#d35400']
const PANTS = ['#2c3e50', '#3b3b3b', '#5d4a36', '#1f3a5f', '#7f8c8d']
const SKIN = ['#f1c9a5', '#d9a77c', '#a8714a', '#7a4b2c', '#e8b98f']

const HIP = 0.9
const SHOULDER = 1.48

// Pessoa low-poly de ~1,75 m, base em y = 0, de frente para -z. Pernas e braços balançam
// em volta do quadril e do ombro.
export interface PedestrianModel {
  root: Group
  legs: [Group, Group]
  arms: [Group, Group]
}

export function createPedestrianModel(id: number, material: Material): PedestrianModel {
  const shirt = SHIRTS[id % SHIRTS.length]
  const pants = PANTS[(id * 3) % PANTS.length]
  const skin = SKIN[(id * 7) % SKIN.length]
  const root = new Group()
  root.add(part(new BoxGeometry(0.42, 0.6, 0.24), shirt, material, 0, 1.2))
  root.add(part(new BoxGeometry(0.22, 0.25, 0.23), skin, material, 0, 1.65))
  const legs = [limb(root, pants, material, -0.11, HIP, 0.16, 0.88), limb(root, pants, material, 0.11, HIP, 0.16, 0.88)] as [Group, Group]
  const arms = [limb(root, shirt, material, -0.28, SHOULDER, 0.11, 0.62), limb(root, shirt, material, 0.28, SHOULDER, 0.11, 0.62)] as [Group, Group]
  return { root, legs, arms }
}

function part(geometry: BufferGeometry, color: string, material: Material, x: number, y: number): Mesh {
  const mesh = new Mesh(paint(geometry, color, x, y), material)
  mesh.castShadow = true
  return mesh
}

// Membro pendurado num pivô (quadril ou ombro).
function limb(root: Group, color: string, material: Material, x: number, y: number, width: number, length: number): Group {
  const pivot = new Group()
  pivot.position.set(x, y, 0)
  pivot.add(part(new BoxGeometry(width, length, width), color, material, 0, -length / 2))
  root.add(pivot)
  return pivot
}

// Passada: pernas e braços em oposição. `phase` em radianos; amplitude 0 = parado.
export function poseWalk(model: PedestrianModel, phase: number, amplitude: number): void {
  const swing = Math.sin(phase) * amplitude
  model.legs[0].rotation.x = swing
  model.legs[1].rotation.x = -swing
  model.arms[0].rotation.x = -swing * 0.8
  model.arms[1].rotation.x = swing * 0.8
}
