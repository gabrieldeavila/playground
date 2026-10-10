import { poseAt } from '../domain/track/pose'
import type { Track } from '../domain/track/types'
import type { Pedestrian } from '../domain/street/types'
import { type PedestrianModel, poseWalk } from './pedestrian-model'

const STRIDE = 4.2 // rad de passada por metro andado
const SWING = 0.55 // rad

// Esperando, olha para a rua; atravessando, olha para onde vai; atropelado, gira no ar e cai de cara.
export function posePedestrian(model: PedestrianModel, ped: Pedestrian, track: Track, time: number): void {
  const pose = poseAt(track, ped.s, ped.x)
  const flight = ped.flight
  model.root.position.set(pose.x, pose.y + (flight?.y ?? 0), pose.z)
  model.root.rotation.set(-(flight?.angle ?? 0), -pose.heading + facing(ped), 0, 'YXZ')
  const walking = ped.state === 'crossing'
  poseWalk(model, time * ped.walkSpeed * STRIDE + ped.id, walking ? SWING : 0)
}

// Giro em volta do eixo vertical, a partir de "olhando para frente na pista".
function facing(ped: Pedestrian): number {
  if (ped.state === 'down') return 0
  const toward = ped.state === 'crossing' ? ped.side : -ped.side
  return (-toward * Math.PI) / 2
}
