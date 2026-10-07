import { type PerspectiveCamera, Vector3 } from 'three'
import { MAX_SPEED } from '../domain/race/constants'
import type { Rider } from '../domain/race/types'
import { lerp } from '../domain/math'
import { poseAt } from '../domain/track/pose'
import type { Track } from '../domain/track/types'

const BEHIND = 6.5
const AHEAD = 14
const HEIGHT = 2.5
const STIFFNESS = 7

// Câmera atrás do piloto, suavizada; o FOV abre com a velocidade.
export class ChaseCamera {
  private readonly position = new Vector3()
  private readonly look = new Vector3()
  private readonly wantedPosition = new Vector3()
  private readonly wantedLook = new Vector3()
  private snapped = false

  constructor(private readonly camera: PerspectiveCamera) {}

  reset(): void {
    this.snapped = false
  }

  update(rider: Rider, track: Track, dt: number): void {
    const back = poseAt(track, rider.s - BEHIND, rider.x * 0.85)
    const ahead = poseAt(track, rider.s + AHEAD, rider.x * 0.6)
    this.wantedPosition.set(back.x, back.y + HEIGHT, back.z)
    this.wantedLook.set(ahead.x, ahead.y + 0.9, ahead.z)

    const k = this.snapped ? 1 - Math.exp(-STIFFNESS * dt) : 1
    this.snapped = true
    this.position.lerp(this.wantedPosition, k)
    this.look.lerp(this.wantedLook, k)
    this.camera.position.copy(this.position)
    this.camera.lookAt(this.look)
    this.camera.fov = lerp(this.camera.fov, 60 + 16 * (rider.speed / MAX_SPEED), k)
    this.camera.updateProjectionMatrix()
  }
}
