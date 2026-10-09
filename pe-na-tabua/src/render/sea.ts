import { Mesh, MeshStandardMaterial, PlaneGeometry } from 'three'
import type { Track } from '../domain/track/types'

const SIZE = 30000 // m: a neblina esconde a borda
const BELOW_ROAD = 5 // m abaixo do ponto mais baixo da pista

// Mar parado embaixo da pista inteira; o barranco do lado do mar mergulha nele.
export function createSea(track: Track, color: string): Mesh {
  const xs = track.points.map((p) => p.x)
  const zs = track.points.map((p) => p.z)
  const level = Math.min(...track.points.map((p) => p.y)) - BELOW_ROAD
  const sea = new Mesh(new PlaneGeometry(SIZE, SIZE), new MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.1 }))
  sea.rotation.x = -Math.PI / 2
  sea.position.set((Math.min(...xs) + Math.max(...xs)) / 2, level, (Math.min(...zs) + Math.max(...zs)) / 2)
  sea.receiveShadow = true
  return sea
}
