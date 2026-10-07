import {
  BoxGeometry,
  type BufferGeometry,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import type { RiderColors } from './rider-colors'

// Partes que a animação mexe. Frente da moto = -z.
export interface BikeModel {
  root: Group // posição e direção na pista
  lean: Group // inclinação nas curvas e queda
  wheels: Group[]
  arms: [Group, Group] // esquerdo, direito (pivô no ombro)
  hips: [Group, Group] // pivô no quadril
  knees: [Group, Group]
}

export const WHEEL_RADIUS = 0.39

export function createBikeModel(colors: RiderColors): BikeModel {
  const m = materials(colors)
  const root = new Group()
  const lean = new Group()
  root.add(lean)

  const wheels = [-0.78, 0.72].map((z) => createWheel(m.rubber, m.chrome, z))
  lean.add(...wheels)
  addBody(lean, m)
  addTorso(lean, m)
  const arms = ([-1, 1] as const).map((side) => createArm(m.jacket, m.dark, side)) as [Group, Group]
  const legs = ([-1, 1] as const).map((side) => createLeg(m.pants, m.dark, side))
  lean.add(...arms, ...legs.map((l) => l.hip))

  return {
    root,
    lean,
    wheels,
    arms,
    hips: [legs[0].hip, legs[1].hip],
    knees: [legs[0].knee, legs[1].knee],
  }
}

function materials(colors: RiderColors) {
  const standard = (color: string, roughness = 0.6, metalness = 0) =>
    new MeshStandardMaterial({ color, roughness, metalness, flatShading: true })
  return {
    paint: standard(colors.bike, 0.35, 0.35),
    jacket: standard(colors.jacket, 0.7),
    helmet: standard(colors.helmet, 0.25, 0.2),
    pants: standard(colors.pants, 0.8),
    dark: standard('#1d1f24', 0.7),
    chrome: standard('#b9bec7', 0.3, 0.9),
    rubber: standard('#151515', 0.95),
    headlight: new MeshStandardMaterial({ color: '#fff6d0', emissive: '#fff1c0', emissiveIntensity: 2 }),
    taillight: new MeshStandardMaterial({ color: '#ff3a2a', emissive: '#ff2010', emissiveIntensity: 1.5 }),
  }
}

type Materials = ReturnType<typeof materials>

function part(geometry: BufferGeometry, material: Material, x: number, y: number, z: number, tiltX = 0): Mesh {
  const mesh = new Mesh(geometry, material)
  mesh.position.set(x, y, z)
  mesh.rotation.x = tiltX
  mesh.castShadow = true
  return mesh
}

function createWheel(rubber: Material, chrome: Material, z: number): Group {
  const wheel = new Group()
  wheel.position.set(0, WHEEL_RADIUS, z)
  wheel.add(
    part(new TorusGeometry(0.29, 0.1, 8, 18).rotateY(Math.PI / 2), rubber, 0, 0, 0),
    part(new CylinderGeometry(0.2, 0.2, 0.06, 12).rotateZ(Math.PI / 2), chrome, 0, 0, 0),
    part(new BoxGeometry(0.07, 0.42, 0.05), rubber, 0, 0, 0),
    part(new BoxGeometry(0.07, 0.05, 0.42), rubber, 0, 0, 0),
  )
  return wheel
}

function addBody(lean: Group, m: Materials): void {
  lean.add(
    part(new BoxGeometry(0.32, 0.34, 0.95), m.paint, 0, 0.66, 0),
    part(new BoxGeometry(0.34, 0.3, 0.45), m.dark, 0, 0.45, 0.02),
    part(new BoxGeometry(0.38, 0.22, 0.5), m.paint, 0, 0.9, -0.22),
    part(new BoxGeometry(0.3, 0.1, 0.55), m.dark, 0, 0.88, 0.32),
    part(new BoxGeometry(0.26, 0.16, 0.3), m.paint, 0, 0.9, 0.68),
    part(new BoxGeometry(0.4, 0.42, 0.3), m.paint, 0, 0.92, -0.62, 0.35),
    part(new BoxGeometry(0.18, 0.1, 0.05), m.headlight, 0, 0.9, -0.79),
    part(new BoxGeometry(0.16, 0.05, 0.04), m.taillight, 0, 0.93, 0.84),
    part(new BoxGeometry(0.06, 0.6, 0.06), m.chrome, 0.12, 0.66, -0.74, 0.35),
    part(new BoxGeometry(0.06, 0.6, 0.06), m.chrome, -0.12, 0.66, -0.74, 0.35),
    part(new BoxGeometry(0.72, 0.05, 0.05), m.dark, 0, 1.08, -0.48),
    part(new CylinderGeometry(0.06, 0.07, 0.6, 8).rotateX(Math.PI / 2), m.chrome, 0.2, 0.42, 0.48),
  )
}

function addTorso(lean: Group, m: Materials): void {
  const head = new Group()
  head.position.set(0, 1.68, -0.08)
  head.add(part(new SphereGeometry(0.17, 12, 10), m.helmet, 0, 0, 0), part(new BoxGeometry(0.22, 0.08, 0.1), m.dark, 0, 0.01, -0.13))
  lean.add(
    part(new BoxGeometry(0.44, 0.62, 0.28), m.jacket, 0, 1.33, 0.12, -0.55),
    part(new BoxGeometry(0.36, 0.2, 0.3), m.pants, 0, 0.98, 0.3),
    head,
  )
}

function createArm(jacket: Material, glove: Material, side: -1 | 1): Group {
  const shoulder = new Group()
  shoulder.position.set(side * 0.24, 1.5, -0.04)
  shoulder.add(part(new BoxGeometry(0.11, 0.11, 0.6), jacket, 0, 0, -0.3), part(new BoxGeometry(0.12, 0.12, 0.12), glove, 0, 0, -0.62))
  return shoulder
}

function createLeg(pants: Material, boot: Material, side: -1 | 1): { hip: Group; knee: Group } {
  const hip = new Group()
  hip.position.set(side * 0.2, 1.0, 0.28)
  hip.add(part(new BoxGeometry(0.15, 0.15, 0.5), pants, 0, 0, -0.25))
  const knee = new Group()
  knee.position.set(0, 0, -0.48)
  knee.add(part(new BoxGeometry(0.13, 0.5, 0.13), pants, 0, -0.25, 0), part(new BoxGeometry(0.14, 0.12, 0.24), boot, 0, -0.52, -0.05))
  hip.add(knee)
  return { hip, knee }
}
