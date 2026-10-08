import { BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial } from 'three'
import { SEGMENT_LENGTH } from '../domain/track/constants'
import type { Track } from '../domain/track/types'
import { gridIndices } from './grid-indices'
import { ROAD_TEXTURE_METERS, createRoadTexture } from './road-texture'
import { ROAD_EDGE } from './terrain-shape'

// Fita de asfalto seguindo a linha central, um par de vértices por ponto.
export function createRoadMesh(track: Track, anisotropy: number): Mesh {
  const positions: number[] = []
  const uvs: number[] = []
  track.points.forEach((p, i) => {
    const rx = Math.cos(p.heading)
    const rz = Math.sin(p.heading)
    positions.push(p.x - rx * ROAD_EDGE, p.y + 0.02, p.z - rz * ROAD_EDGE)
    positions.push(p.x + rx * ROAD_EDGE, p.y + 0.02, p.z + rz * ROAD_EDGE)
    const v = (i * SEGMENT_LENGTH) / ROAD_TEXTURE_METERS
    uvs.push(0, v, 1, v)
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(gridIndices(track.points.length, 2))
  geometry.computeVertexNormals()

  const material = new MeshStandardMaterial({ map: createRoadTexture(anisotropy), roughness: 0.88, metalness: 0 })
  const mesh = new Mesh(geometry, material)
  mesh.receiveShadow = true
  return mesh
}
