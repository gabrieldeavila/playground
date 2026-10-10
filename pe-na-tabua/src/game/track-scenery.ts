import { Group, type Scene } from 'three'
import type { Track } from '../domain/track/types'
import { disposeTree } from '../render/dispose-tree'
import { createFinishArch } from '../render/finish-arch'
import { createPropMeshes } from '../render/props-mesh'
import { createRoadMesh } from '../render/road-mesh'
import { createSea } from '../render/sea'
import { createTerrainMeshes } from '../render/terrain-mesh'
import { THEMES } from '../render/theme/themes'

// Asfalto, barrancos, objetos, chegada e mar. Cada nível tem uma pista: troca tudo quando ela muda.
export class TrackScenery {
  private group: Group | null = null
  private track: Track | null = null

  constructor(
    private readonly scene: Scene,
    private readonly anisotropy: number,
  ) {}

  show(track: Track): void {
    if (track === this.track) return
    if (this.group) {
      this.scene.remove(this.group)
      disposeTree(this.group)
    }
    const theme = THEMES[track.theme]
    this.group = new Group()
    this.group.add(
      createRoadMesh(track, this.anisotropy, theme.rumble),
      ...createTerrainMeshes(track, this.anisotropy, theme.terrain),
      ...createPropMeshes(track),
      createFinishArch(track),
    )
    if (theme.sea) this.group.add(createSea(track, theme.sea))
    this.scene.add(this.group)
    this.track = track
  }
}
