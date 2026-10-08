import { type PerspectiveCamera, Vector3 } from 'three'
import { lerp } from '../../domain/math'
import type { Rider } from '../../domain/race/types'
import { poseAt } from '../../domain/track/pose'
import type { Track } from '../../domain/track/types'
import { applyHead } from './apply-head'
import { type SpeedFeel, feelFov, headAngles } from './speed-feel'

// Baixa e colada na moto, olhando um pouco para baixo: horizonte acima do meio da tela, moto embaixo.
const BEHIND = 6.2
const PULLBACK = 1.2 // recua um pouco quando a moto arranca forte
const HEIGHT = 1.9
const LOOK_AHEAD = 24
const TILT = 0.13
const ROLL = 0.035
const LATERAL_STIFFNESS = 12 // segue o x da moto quase rígido, mantendo-a no centro
const FOV_STIFFNESS = 14
const BASE_FOV = 60
const FOV_RANGE = 12
const BLEND_TIME = 0.6 // vindo da primeira pessoa, desliza até o lugar

// Câmera de perseguição estilo fliperama dos anos 90.
export class ChaseCamera {
  private x = 0
  private snapped = false
  private blend = 1
  private readonly fromPosition = new Vector3()
  private readonly fromLook = new Vector3()
  private readonly position = new Vector3()
  private readonly look = new Vector3()

  constructor(private readonly camera: PerspectiveCamera) {}

  reset(): void {
    this.snapped = false
    this.blend = 1
  }

  // Começa a perseguição de onde a câmera está agora, para recuar suave.
  continueFrom(camera: PerspectiveCamera): void {
    this.fromPosition.copy(camera.position)
    this.fromLook.copy(camera.position).add(camera.getWorldDirection(this.look).multiplyScalar(10))
    this.blend = 0
  }

  update(rider: Rider, track: Track, feel: SpeedFeel, dt: number, time: number): void {
    const k = this.snapped ? 1 - Math.exp(-LATERAL_STIFFNESS * dt) : 1
    this.x = lerp(this.x, rider.x, k)
    const back = poseAt(track, rider.s - BEHIND - PULLBACK * Math.max(0, feel.surge), this.x)
    const ahead = poseAt(track, rider.s + LOOK_AHEAD, this.x)
    this.position.set(back.x, back.y + HEIGHT, back.z)
    this.look.set(ahead.x, ahead.y + HEIGHT, ahead.z)

    this.blend = Math.min(1, this.blend + dt / BLEND_TIME)
    const t = this.blend * this.blend * (3 - 2 * this.blend)
    this.camera.position.lerpVectors(this.fromPosition, this.position, t)
    this.camera.lookAt(this.look.lerpVectors(this.fromLook, this.look, t))
    applyHead(this.camera, headAngles(feel, time), TILT, -rider.steer * ROLL)

    const fov = feelFov(feel, BASE_FOV, FOV_RANGE)
    this.camera.fov = this.snapped ? lerp(this.camera.fov, fov, 1 - Math.exp(-FOV_STIFFNESS * dt)) : fov
    this.camera.updateProjectionMatrix()
    this.snapped = true
  }
}
