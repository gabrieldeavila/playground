import {
  CircleGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three'
import { clamp } from '../../domain/math'
import { COWL_DEPTH, COWL_HALF_WIDTH, cowlTop } from './layout'
import { tubeBetween } from './tube'

const WINDSHIELD_HALF_WIDTH = 0.42

// Carenagem, painel preto, para-brisa e guidão vistos de cima do banco.
export function createFairing(bikeColor: string, chrome: Material): Group {
  const paint = new MeshStandardMaterial({ color: bikeColor, roughness: 0.28, metalness: 0.35 })
  const black = new MeshStandardMaterial({ color: '#141518', roughness: 0.6 })
  const group = new Group()
  group.add(cowl(paint), panel(black), windshield(), ...lights(), ...handlebars(chrome, black))
  return group
}

function cowl(material: Material): Mesh {
  const shape = new Shape()
  shape.moveTo(-COWL_HALF_WIDTH, -0.08)
  for (let i = 0; i <= 24; i++) {
    const x = -COWL_HALF_WIDTH + (2 * COWL_HALF_WIDTH * i) / 24
    shape.lineTo(x, cowlTop(x))
  }
  shape.lineTo(COWL_HALF_WIDTH, -0.08)
  const geometry = new ExtrudeGeometry(shape, {
    depth: COWL_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  })
  geometry.translate(0, 0, -COWL_DEPTH)
  taperForward(geometry)
  return new Mesh(geometry, material)
}

// Afina e abaixa a carenagem para a frente, como o bico de uma moto.
function taperForward(geometry: ExtrudeGeometry): void {
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const t = clamp(-position.getZ(i) / COWL_DEPTH, 0, 1)
    position.setX(i, position.getX(i) * (1 - 0.18 * t))
    position.setY(i, position.getY(i) - 0.07 * t)
  }
  geometry.computeVertexNormals()
}

function panel(material: Material): Mesh {
  const shape = roundedRect(-0.2, 0.02, 0.4, 0.17, 0.03)
  const mesh = new Mesh(new ShapeGeometry(shape), material)
  mesh.position.z = 0.014
  return mesh
}

function windshield(): Mesh {
  const shape = new Shape()
  const w = WINDSHIELD_HALF_WIDTH
  shape.moveTo(-w, cowlTop(-w))
  for (let i = 0; i <= 20; i++) {
    const x = w - (2 * w * i) / 20
    shape.lineTo(x, cowlTop(x) + 0.03 + 0.13 * (1 - (x / w) ** 2))
  }
  for (let i = 0; i <= 20; i++) {
    const x = -w + (2 * w * i) / 20
    shape.lineTo(x, cowlTop(x))
  }
  const material = new MeshStandardMaterial({
    color: '#9ec3dc',
    transparent: true,
    opacity: 0.14,
    roughness: 0.05,
    metalness: 0.1,
    depthWrite: false,
    side: DoubleSide,
  })
  const mesh = new Mesh(new ShapeGeometry(shape), material)
  mesh.position.set(0, -0.055, -0.3)
  mesh.rotation.x = -0.35
  return mesh
}

// Luzinhas de ponto morto e farol, embaixo do visor.
function lights(): Mesh[] {
  return [
    ['#38e070', -0.014],
    ['#3a9bff', 0.014],
  ].map(([color, x]) => {
    const material = new MeshStandardMaterial({ color: color as string, emissive: color as string, emissiveIntensity: 1.2 })
    const light = new Mesh(new CircleGeometry(0.006, 16), material)
    light.position.set(x as number, 0.05, 0.016)
    return light
  })
}

function handlebars(chrome: Material, grip: Material): Mesh[] {
  return [-1, 1].flatMap((side) => [
    tubeBetween(new Vector3(side * 0.2, 0.02, -0.08), new Vector3(side * 0.5, 0.045, 0.04), 0.014, chrome),
    tubeBetween(new Vector3(side * 0.5, 0.045, 0.04), new Vector3(side * 0.64, 0.05, 0.08), 0.024, grip),
  ])
}

function roundedRect(x: number, y: number, width: number, height: number, radius: number): Shape {
  const shape = new Shape()
  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + radius)
  shape.lineTo(x + width, y + height - radius)
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  shape.lineTo(x + radius, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)
  return shape
}
