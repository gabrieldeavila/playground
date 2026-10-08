import { BufferGeometry, Color, Float32BufferAttribute, Mesh, MeshStandardMaterial } from 'three'
import { SEGMENT_LENGTH } from '../domain/track/constants'
import type { Track } from '../domain/track/types'
import { GROUND_TEXTURE_METERS, createGroundTexture } from './ground-texture'
import { gridIndices } from './grid-indices'
import { ROAD_EDGE, TERRAIN_OFFSETS, terrainColor, terrainHeight } from './terrain-shape'

const MAX_OFFSET = TERRAIN_OFFSETS[TERRAIN_OFFSETS.length - 1]

// Dois barrancos, um de cada lado da pista.
export function createTerrainMeshes(track: Track, anisotropy: number): Mesh[] {
  const map = createGroundTexture(anisotropy)
  const material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, map })
  return ([-1, 1] as const).map((side) => {
    const mesh = new Mesh(buildSide(track, side), material)
    mesh.receiveShadow = true
    return mesh
  })
}

function buildSide(track: Track, side: -1 | 1): BufferGeometry {
  // Colunas sempre da esquerda para a direita, para as faces ficarem para cima.
  const offsets = side === 1 ? TERRAIN_OFFSETS : [...TERRAIN_OFFSETS].reverse()
  const positions: number[] = []
  const colors: number[] = []
  const uvs: number[] = []
  const color = new Color()
  track.points.forEach((p, i) => {
    const squeeze = innerSqueeze(track, i, side)
    const rx = Math.cos(p.heading)
    const rz = Math.sin(p.heading)
    for (const offset of offsets) {
      const d = offset * squeeze
      const lateral = side * (ROAD_EDGE + d)
      const x = p.x + rx * lateral
      const z = p.z + rz * lateral
      const height = terrainHeight(d, x, z)
      positions.push(x, p.y + height, z)
      terrainColor(d, height, x, z, color)
      colors.push(color.r, color.g, color.b)
      uvs.push(d / GROUND_TEXTURE_METERS, (i * SEGMENT_LENGTH) / GROUND_TEXTURE_METERS)
    }
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(gridIndices(track.points.length, offsets.length))
  geometry.computeVertexNormals()
  return geometry
}

// No lado de dentro de uma curva o terreno encolhe para não se dobrar sobre si.
function innerSqueeze(track: Track, pointIndex: number, side: -1 | 1): number {
  const segments = track.segments
  const before = segments[Math.max(0, pointIndex - 1)].curve
  const after = segments[Math.min(segments.length - 1, pointIndex)].curve
  const curve = (before + after) / 2
  if (Math.abs(curve) < 1e-4 || Math.sign(curve) !== side) return 1
  const room = 0.85 / Math.abs(curve) - ROAD_EDGE
  return Math.min(1, Math.max(0.05, room / MAX_OFFSET))
}
