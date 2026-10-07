import type { Group, Mesh, PerspectiveCamera, Scene } from 'three'
import type { Track } from '../domain/track/types'
import { createBackdrop, followBackdrop } from '../render/backdrop'
import { createFinishArch } from '../render/finish-arch'
import { createPropMeshes } from '../render/props-mesh'
import { createRoadMesh } from '../render/road-mesh'
import { createSky } from '../render/sky'
import { createTerrainMeshes } from '../render/terrain-mesh'

export interface WorldView {
  sky: Mesh
  backdrop: Group
}

// Cenário fixo: monta uma vez a partir da pista.
export function buildWorld(scene: Scene, track: Track, anisotropy: number): WorldView {
  const sky = createSky()
  const backdrop = createBackdrop()
  scene.add(
    sky,
    backdrop,
    createRoadMesh(track, anisotropy),
    ...createTerrainMeshes(track),
    ...createPropMeshes(track),
    createFinishArch(track),
  )
  return { sky, backdrop }
}

export function followCamera(world: WorldView, camera: PerspectiveCamera): void {
  world.sky.position.copy(camera.position)
  followBackdrop(world.backdrop, camera.position.x, camera.position.z)
}
