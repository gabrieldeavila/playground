import { type PerspectiveCamera, Vector3 } from 'three'
import { lerp } from '../domain/math'
import { MAX_SPEED } from '../domain/race/constants'
import type { Rider } from '../domain/race/types'
import { poseAt } from '../domain/track/pose'
import type { Track } from '../domain/track/types'

const EYE_HEIGHT = 1.5
const LOOK_AHEAD = 18
const MAX_ROLL = 0.22 // inclinação da cabeça junto com a moto (rad)
const STIFFNESS = 14

// Olhos do piloto: segue a pista adiante e inclina nas curvas.
export class FirstPersonCamera {
  private readonly look = new Vector3()
  private readonly wantedLook = new Vector3()
  private snapped = false

  constructor(private readonly camera: PerspectiveCamera) {}

  reset(): void {
    this.snapped = false
  }

  update(rider: Rider, track: Track, dt: number, time: number): void {
    const eye = poseAt(track, rider.s, rider.x)
    const ahead = poseAt(track, rider.s + LOOK_AHEAD, rider.x)
    const speedRatio = rider.speed / MAX_SPEED
    const shake = (Math.sin(time * 61) * 0.006 + Math.sin(time * 23) * 0.004) * speedRatio

    this.camera.position.set(eye.x, eye.y + EYE_HEIGHT + shake, eye.z)
    this.wantedLook.set(ahead.x, ahead.y + EYE_HEIGHT - 0.35, ahead.z)
    const k = this.snapped ? 1 - Math.exp(-STIFFNESS * dt) : 1
    this.snapped = true
    this.look.lerp(this.wantedLook, k)
    this.camera.lookAt(this.look)
    this.camera.rotateZ(-rider.steer * MAX_ROLL)
    this.camera.fov = lerp(this.camera.fov, 68 + 14 * speedRatio, k)
    this.camera.updateProjectionMatrix()
  }
}
