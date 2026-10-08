import type { PerspectiveCamera } from 'three'
import type { HeadAngles } from './speed-feel'

// Depois do lookAt: abaixa o olhar em `tilt`, inclina em `roll` e soma o balanço da cabeça.
export function applyHead(camera: PerspectiveCamera, head: HeadAngles, tilt: number, roll: number): void {
  camera.rotateX(-tilt + head.pitch)
  camera.rotateY(head.yaw)
  camera.rotateZ(roll + head.roll)
}
