import { BoxGeometry, CanvasTexture, Group, Mesh, MeshStandardMaterial, NearestFilter, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three'
import { poseAt } from '../domain/track/pose'
import type { Track } from '../domain/track/types'
import { ROAD_EDGE } from './terrain-shape'

// Pórtico quadriculado e faixa no asfalto na linha de chegada.
export function createFinishArch(track: Track): Group {
  const pose = poseAt(track, track.finishS)
  const group = new Group()
  group.position.set(pose.x, pose.y, pose.z)
  group.rotation.y = -pose.heading

  const metal = new MeshStandardMaterial({ color: '#d9d9d9', metalness: 0.6, roughness: 0.4 })
  for (const side of [-1, 1]) {
    const pillar = new Mesh(new BoxGeometry(0.4, 7, 0.4), metal)
    pillar.position.set(side * (ROAD_EDGE + 0.6), 3.5, 0)
    pillar.castShadow = true
    group.add(pillar)
  }
  const banner = new Mesh(new BoxGeometry(ROAD_EDGE * 2 + 1.6, 1.3, 0.3), checkerMaterial(24, 2))
  banner.position.y = 6.4
  banner.castShadow = true
  group.add(banner)

  const strip = new Mesh(new PlaneGeometry(ROAD_EDGE * 2, 1.6), checkerMaterial(16, 2))
  strip.rotation.x = -Math.PI / 2
  strip.position.y = 0.04
  strip.receiveShadow = true
  group.add(strip)
  return group
}

function checkerMaterial(repeatX: number, repeatY: number): MeshStandardMaterial {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f2f2f2'
  ctx.fillRect(0, 0, 2, 2)
  ctx.fillStyle = '#151515'
  ctx.fillRect(0, 0, 1, 1)
  ctx.fillRect(1, 1, 1, 1)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  return new MeshStandardMaterial({ map: texture, roughness: 0.8 })
}
