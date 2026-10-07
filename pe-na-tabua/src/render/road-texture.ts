import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three'
import { createRng } from '../domain/random'
import { ROAD_EDGE } from './terrain-shape'

// Quantos metros de pista uma repetição da textura cobre.
export const ROAD_TEXTURE_METERS = 16

const SIZE = 512
const RUMBLE = 0.9 // largura da zebra (m)
const LINE = 0.15

// Asfalto com zebra vermelha/branca, faixa de borda e tracejado central.
export function createRoadTexture(anisotropy: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  const px = (meters: number) => (meters / (ROAD_EDGE * 2)) * SIZE
  const py = (meters: number) => (meters / ROAD_TEXTURE_METERS) * SIZE

  paintAsphalt(ctx)
  paintRumble(ctx, 0, px(RUMBLE), py)
  paintRumble(ctx, SIZE - px(RUMBLE), px(RUMBLE), py)
  ctx.fillStyle = '#ece8dc'
  ctx.fillRect(px(RUMBLE), 0, px(LINE), SIZE)
  ctx.fillRect(SIZE - px(RUMBLE + LINE), 0, px(LINE), SIZE)
  ctx.fillStyle = '#efe3b8'
  for (const start of [0, 8]) ctx.fillRect(SIZE / 2 - px(LINE) / 2, py(start), px(LINE), py(3))

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = anisotropy
  return texture
}

function paintAsphalt(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3b3d42'
  ctx.fillRect(0, 0, SIZE, SIZE)
  const rng = createRng(3)
  for (let i = 0; i < 9000; i++) {
    const shade = 40 + Math.floor(rng() * 40)
    ctx.fillStyle = `rgba(${shade},${shade},${shade + 4},0.5)`
    ctx.fillRect(rng() * SIZE, rng() * SIZE, 2, 2)
  }
  // Marcas de pneu escurecendo o meio de cada faixa.
  ctx.fillStyle = 'rgba(20,20,24,0.18)'
  for (const center of [0.3, 0.7]) ctx.fillRect(SIZE * center - 18, 0, 36, SIZE)
}

function paintRumble(ctx: CanvasRenderingContext2D, x: number, width: number, py: (m: number) => number): void {
  const stripe = 2
  for (let m = 0; m < ROAD_TEXTURE_METERS; m += stripe) {
    ctx.fillStyle = (m / stripe) % 2 === 0 ? '#c8352e' : '#ece8dc'
    ctx.fillRect(x, py(m), width, py(stripe))
  }
}
