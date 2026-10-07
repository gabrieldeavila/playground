import type { PerspectiveCamera } from 'three'
import type { Race } from '../domain/race/types'
import { ChaseCamera } from '../render/chase-camera'
import { FirstPersonCamera } from '../render/first-person-camera'
import type { RidersView } from './riders-view'

export type View = 'cockpit' | 'chase'

// Escolhe a câmera: primeira pessoa por padrão, perseguição se o jogador pedir
// ou enquanto ele estiver caído (para ver o tombo).
export class CameraDirector {
  preferred: View = 'cockpit'
  private active: View | null = null
  private readonly chase: ChaseCamera
  private readonly firstPerson: FirstPersonCamera

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly riders: RidersView,
  ) {
    this.chase = new ChaseCamera(camera)
    this.firstPerson = new FirstPersonCamera(camera)
  }

  get showsCockpit(): boolean {
    return this.active === 'cockpit'
  }

  toggle(): void {
    this.preferred = this.preferred === 'cockpit' ? 'chase' : 'cockpit'
  }

  reset(): void {
    this.active = null
    this.chase.reset()
    this.firstPerson.reset()
  }

  update(race: Race, dt: number): void {
    const player = race.riders[race.playerId]
    const view: View = this.preferred === 'cockpit' && player.crashTimer <= 0 ? 'cockpit' : 'chase'
    if (view !== this.active) this.switchTo(view, race.playerId)
    if (view === 'cockpit') this.firstPerson.update(player, race.track, dt, race.time)
    else this.chase.update(player, race.track, dt)
  }

  private switchTo(view: View, playerId: number): void {
    if (view === 'chase' && this.active === 'cockpit') this.chase.continueFrom(this.camera)
    if (view === 'cockpit') this.firstPerson.reset()
    this.riders.setVisible(playerId, view === 'chase')
    this.active = view
  }
}
