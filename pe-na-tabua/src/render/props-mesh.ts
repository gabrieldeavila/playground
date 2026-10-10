import { Color, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3, Euler } from 'three'
import { createRng } from '../domain/random'
import { poseAt } from '../domain/track/pose'
import type { Prop, PropKind, Track } from '../domain/track/types'
import { PROP_MODELS } from './prop-models'
import { ROAD_EDGE, groundOf, terrainHeight } from './terrain-shape'

// Um InstancedMesh por tipo de objeto: milhares de árvores em poucas chamadas de desenho.
export function createPropMeshes(track: Track): InstancedMesh[] {
  const material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 })
  const byKind = groupByKind(track.props)
  const rng = createRng(11)
  return [...byKind].map(([kind, props]) => {
    const mesh = new InstancedMesh(PROP_MODELS[kind](), material, props.length)
    props.forEach((prop, i) => {
      mesh.setMatrixAt(i, propMatrix(track, prop))
      mesh.setColorAt(i, tintFor(kind, rng))
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    return mesh
  })
}

const BUILDING_TINTS = ['#f2e2c6', '#d9c3ae', '#c7d2dc', '#e8cfbd', '#bccab5', '#ead8a2', '#d3b4a4', '#a9b4c2']
const BUILDINGS: PropKind[] = ['block', 'tower', 'shop']

// Prédios ganham uma cor da paleta; o resto, um tom mais claro ou mais escuro do modelo.
function tintFor(kind: PropKind, rng: () => number): Color {
  if (BUILDINGS.includes(kind)) return new Color(BUILDING_TINTS[Math.floor(rng() * BUILDING_TINTS.length)])
  return new Color().setScalar(0.82 + rng() * 0.36)
}

function groupByKind(props: Prop[]): Map<PropKind, Prop[]> {
  const groups = new Map<PropKind, Prop[]>()
  for (const prop of props) {
    const list = groups.get(prop.kind) ?? []
    list.push(prop)
    groups.set(prop.kind, list)
  }
  return groups
}

function propMatrix(track: Track, prop: Prop): Matrix4 {
  const pose = poseAt(track, prop.s, prop.x)
  const d = Math.max(0, Math.abs(prop.x) - ROAD_EDGE)
  const position = new Vector3(pose.x, pose.y + terrainHeight(d, pose.x, pose.z, groundOf(track, Math.sign(prop.x))), pose.z)
  const rotation = new Quaternion().setFromEuler(new Euler(0, -pose.heading + prop.rotation, 0))
  return new Matrix4().compose(position, rotation, new Vector3().setScalar(prop.scale))
}
