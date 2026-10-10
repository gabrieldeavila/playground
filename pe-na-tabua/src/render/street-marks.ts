import { CircleGeometry, Euler, type BufferGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry, Quaternion, Vector3 } from 'three'
import { ROAD_HALF_WIDTH } from '../domain/track/constants'
import { poseAt } from '../domain/track/pose'
import type { Track } from '../domain/track/types'
import type { Street } from '../domain/street/types'

const LIFT = 0.04 // m acima do asfalto, para não piscar com ele
const STRIPE_WIDTH = 0.55
const STRIPE_LENGTH = 3
const STRIPE_GAP = 0.6
const POTHOLE_STRETCH = 1.3 // buraco mais comprido que largo
const POTHOLE_RIM = 1.3 // borda de asfalto quebrado, mais clara, em volta do buraco

// Pintura e buracos do asfalto: faixas de pedestres (zebra) e buracos escuros.
export function createStreetMarks(track: Track, street: Street): InstancedMesh[] {
  const stripes = crosswalkStripes(street.crosswalks)
  const meshes: InstancedMesh[] = []
  if (stripes.length > 0) meshes.push(flatMesh(track, new PlaneGeometry(STRIPE_WIDTH, STRIPE_LENGTH), '#e9e6dc', stripes))
  if (street.potholes.length > 0) {
    const holes = (grow: number, lift: number) =>
      street.potholes.map((p) => ({ s: p.s, x: p.x, lift, scale: new Vector3(p.radius * grow, 1, p.radius * grow * POTHOLE_STRETCH) }))
    meshes.push(flatMesh(track, new CircleGeometry(1, 9), '#77736a', holes(POTHOLE_RIM, LIFT)))
    meshes.push(flatMesh(track, new CircleGeometry(1, 9), '#101012', holes(1, LIFT + 0.01)))
  }
  return meshes
}

interface Mark {
  s: number
  x: number
  lift?: number
  scale?: Vector3
}

// Listras ao longo da pista, uma ao lado da outra atravessando o asfalto.
function crosswalkStripes(crosswalks: number[]): Mark[] {
  const marks: Mark[] = []
  const step = STRIPE_WIDTH + STRIPE_GAP
  for (const s of crosswalks) {
    for (let x = -ROAD_HALF_WIDTH + step / 2; x < ROAD_HALF_WIDTH; x += step) marks.push({ s, x })
  }
  return marks
}

function flatMesh(track: Track, shape: BufferGeometry, color: string, marks: Mark[]): InstancedMesh {
  const geometry = shape.rotateX(-Math.PI / 2)
  const material = new MeshStandardMaterial({ color, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })
  const mesh = new InstancedMesh(geometry, material, marks.length)
  const one = new Vector3(1, 1, 1)
  marks.forEach((mark, i) => {
    const pose = poseAt(track, mark.s, mark.x)
    const rotation = new Quaternion().setFromEuler(new Euler(pose.pitch, -pose.heading, 0, 'YXZ'))
    mesh.setMatrixAt(i, new Matrix4().compose(new Vector3(pose.x, pose.y + (mark.lift ?? LIFT), pose.z), rotation, mark.scale ?? one))
  })
  mesh.receiveShadow = true
  mesh.computeBoundingSphere()
  return mesh
}
