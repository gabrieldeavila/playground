import { Color, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3, Euler } from 'three'
import { createRng } from '../domain/random'
import { poseAt } from '../domain/track/pose'
import type { Prop, PropKind, Track } from '../domain/track/types'
import { PROP_MODELS } from './prop-models'
import { ROAD_EDGE, terrainHeight } from './terrain-shape'

// Um InstancedMesh por tipo de objeto: milhares de árvores em poucas chamadas de desenho.
export function createPropMeshes(track: Track): InstancedMesh[] {
  const material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 })
  const byKind = groupByKind(track.props)
  const rng = createRng(11)
  return [...byKind].map(([kind, props]) => {
    const mesh = new InstancedMesh(PROP_MODELS[kind](), material, props.length)
    props.forEach((prop, i) => {
      mesh.setMatrixAt(i, propMatrix(track, prop))
      mesh.setColorAt(i, new Color().setScalar(0.82 + rng() * 0.36))
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    return mesh
  })
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
  const toSea = Math.sign(prop.x) === track.scenery.seaSide
  const position = new Vector3(pose.x, pose.y + terrainHeight(d, pose.x, pose.z, toSea), pose.z)
  const rotation = new Quaternion().setFromEuler(new Euler(0, -pose.heading + prop.rotation, 0))
  return new Matrix4().compose(position, rotation, new Vector3().setScalar(prop.scale))
}
