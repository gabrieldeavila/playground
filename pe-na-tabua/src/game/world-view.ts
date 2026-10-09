import type { Group, Mesh, PerspectiveCamera } from 'three'
import { createBackdrop, followBackdrop } from '../render/backdrop'
import { disposeTree } from '../render/dispose-tree'
import { createSky, setSkyTheme } from '../render/sky'
import { type Stage, setStageTheme } from '../render/stage'
import type { Theme } from '../render/theme/theme'

// Céu, horizonte, neblina e luz: o que cerca a pista. Muda junto com o tema da pista.
export class WorldView {
  theme: Theme
  private readonly sky: Mesh
  private backdrop: Group

  constructor(
    private readonly stage: Stage,
    theme: Theme,
  ) {
    this.sky = createSky()
    this.backdrop = createBackdrop(theme.backdrop)
    stage.scene.add(this.sky, this.backdrop)
    this.theme = theme
    this.apply(theme)
  }

  setTheme(theme: Theme): void {
    if (theme === this.theme) return
    this.stage.scene.remove(this.backdrop)
    disposeTree(this.backdrop)
    this.backdrop = createBackdrop(theme.backdrop)
    this.stage.scene.add(this.backdrop)
    this.theme = theme
    this.apply(theme)
  }

  follow(camera: PerspectiveCamera): void {
    this.sky.position.copy(camera.position)
    followBackdrop(this.backdrop, camera.position.x, camera.position.z)
  }

  private apply(theme: Theme): void {
    setSkyTheme(this.sky, theme)
    setStageTheme(this.stage, theme)
  }
}
