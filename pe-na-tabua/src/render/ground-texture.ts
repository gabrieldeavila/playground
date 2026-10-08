import { CanvasTexture, RepeatWrapping } from 'three'
import { createRng } from '../domain/random'

// Quantos metros de terreno uma repetição da textura cobre.
export const GROUND_TEXTURE_METERS = 6

const SIZE = 256

// Manchas e grãos que multiplicam a cor do terreno (dado linear, sem sRGB): dão "movimento" ao acostamento.
export function createGroundTexture(anisotropy: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ececec'
  ctx.fillRect(0, 0, SIZE, SIZE)
  const rng = createRng(17)
  for (let i = 0; i < 260; i++) blot(ctx, rng(), rng(), 3 + rng() * 9, 175 + rng() * 60)
  for (let i = 0; i < 5000; i++) {
    const shade = Math.floor(150 + rng() * 105)
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`
    ctx.fillRect(rng() * SIZE, rng() * SIZE, 2, 2)
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = anisotropy
  return texture
}

function blot(ctx: CanvasRenderingContext2D, u: number, v: number, radius: number, shade: number): void {
  ctx.fillStyle = `rgb(${shade},${shade},${shade})`
  // Repete nas bordas para a textura emendar sem costura.
  for (const dx of [-SIZE, 0, SIZE]) {
    for (const dy of [-SIZE, 0, SIZE]) {
      ctx.beginPath()
      ctx.arc(u * SIZE + dx, v * SIZE + dy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
