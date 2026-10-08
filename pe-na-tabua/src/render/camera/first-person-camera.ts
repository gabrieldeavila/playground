import { type PerspectiveCamera, Vector3 } from 'three'
import { lerp } from '../../domain/math'
import type { Rider } from '../../domain/race/types'
import { poseAt } from '../../domain/track/pose'
import type { Track } from '../../domain/track/types'
import { applyHead } from './apply-head'
import { type SpeedFeel, feelFov, headAngles } from './speed-feel'

const EYE_HEIGHT = 1.2 // deitado no tanque: olho perto do chão, o asfalto passa mais rápido
const LOOK_AHEAD = 18
const TILT = 0.02
const MAX_ROLL = 0.22 // inclinação da cabeça junto com a moto (rad)
const STIFFNESS = 14
const BASE_FOV = 68
const FOV_RANGE = 18

// Olhos do piloto: segue a pista adiante, inclina nas curvas e sente a aceleração.
export class FirstPersonCamera {
  private readonly look = new Vector3()
  private readonly wantedLook = new Vector3()
  private snapped = false

  constructor(private readonly camera: PerspectiveCamera) {}

  reset(): void {
    this.snapped = false
  }

  update(rider: Rider, track: Track, feel: SpeedFeel, dt: number, time: number): void {
    const eye = poseAt(track, rider.s, rider.x)
    const ahead = poseAt(track, rider.s + LOOK_AHEAD, rider.x)
    this.camera.position.set(eye.x, eye.y + EYE_HEIGHT, eye.z)
    this.wantedLook.set(ahead.x, ahead.y + EYE_HEIGHT, ahead.z)
    const k = this.snapped ? 1 - Math.exp(-STIFFNESS * dt) : 1
    this.snapped = true
    this.look.lerp(this.wantedLook, k)
    this.camera.lookAt(this.look)
    applyHead(this.camera, headAngles(feel, time), TILT, -rider.steer * MAX_ROLL)
    this.camera.fov = lerp(this.camera.fov, feelFov(feel, BASE_FOV, FOV_RANGE), k)
    this.camera.updateProjectionMatrix()
  }
}
