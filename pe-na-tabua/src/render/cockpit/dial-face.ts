import { CanvasTexture, SRGBColorSpace } from 'three'

export interface DialSpec {
  max: number
  labelStep: number
  minorStep: number
  unit: string
  redFrom?: number
}

const SIZE = 256

// Ponteiro varre 270°: do canto inferior esquerdo (0) ao inferior direito (max).
export function dialAngle(fraction: number): number {
  return ((225 - 270 * fraction) * Math.PI) / 180
}

// Mostrador branco com marcas, números e faixa vermelha.
export function drawDialFace(spec: DialSpec): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  const c = SIZE / 2
  const r = SIZE / 2 - 4

  const face = ctx.createRadialGradient(c, c * 0.75, 10, c, c, r)
  face.addColorStop(0, '#ffffff')
  face.addColorStop(1, '#d4d0c6')
  ctx.fillStyle = face
  ctx.beginPath()
  ctx.arc(c, c, r, 0, Math.PI * 2)
  ctx.fill()

  if (spec.redFrom !== undefined) drawRedZone(ctx, c, r - 12, spec.redFrom / spec.max)
  drawTicks(ctx, spec, c, r)

  ctx.fillStyle = '#3a3a3a'
  ctx.font = 'italic 600 18px system-ui, sans-serif'
  ctx.fillText(spec.unit, c, c + r * 0.5)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// Canvas mede ângulos no sentido horário, por isso os sinais trocados.
function drawRedZone(ctx: CanvasRenderingContext2D, c: number, radius: number, from: number): void {
  ctx.strokeStyle = '#d6281e'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(c, c, radius, -dialAngle(from), -dialAngle(1))
  ctx.stroke()
}

function drawTicks(ctx: CanvasRenderingContext2D, spec: DialSpec, c: number, r: number): void {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = '#1a1a1a'
  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'italic 800 24px system-ui, sans-serif'
  const steps = Math.round(spec.max / spec.minorStep)
  for (let i = 0; i <= steps; i++) {
    const value = i * spec.minorStep
    const major = Math.abs(value / spec.labelStep - Math.round(value / spec.labelStep)) < 1e-6
    const a = dialAngle(value / spec.max)
    const inner = r - (major ? 24 : 13)
    ctx.lineWidth = major ? 4 : 2
    ctx.beginPath()
    ctx.moveTo(c + Math.cos(a) * inner, c - Math.sin(a) * inner)
    ctx.lineTo(c + Math.cos(a) * (r - 3), c - Math.sin(a) * (r - 3))
    ctx.stroke()
    if (major) ctx.fillText(String(Math.round(value)), c + Math.cos(a) * (r - 44), c - Math.sin(a) * (r - 44))
  }
}
