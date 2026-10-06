import type { Tell } from '../bots/controller'
import type { Fighter } from '../sim/types'
import { BONES, HEAD_RADIUS } from './pose'
import type { Skeleton, Vec } from './pose'

// Cada bot se diferencia só com o que dá pra desenhar em cima do palito: cor, grossura do traço
// e um acessório. Nada de imagem.
export type Accessory = 'none' | 'belt' | 'bandana' | 'sneakers' | 'shell' | 'trail'

export interface Look {
  color: string
  width: number
  accessory: Accessory
}

export const PLAYER_LOOK: Look = { color: '#ff5d5d', width: 5, accessory: 'none' }

const BACKGROUND = '#111318'

export function drawStickman(
  ctx: CanvasRenderingContext2D,
  s: Skeleton,
  look: Look,
  facing: 1 | -1,
  tick: number,
  color = look.color,
): void {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (look.accessory === 'shell') drawShell(ctx, s, facing, color)

  ctx.strokeStyle = color
  ctx.lineWidth = look.width
  ctx.beginPath()
  for (const [a, b] of BONES) {
    if (a === 'head') continue
    ctx.moveTo(s[a].x, s[a].y)
    ctx.lineTo(s[b].x, s[b].y)
  }
  ctx.stroke()

  ctx.fillStyle = BACKGROUND
  ctx.beginPath()
  ctx.arc(s.head.x, s.head.y, HEAD_RADIUS, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  if (look.accessory === 'bandana') drawBandana(ctx, s, facing, tick)
  else if (look.accessory === 'belt') drawBelt(ctx, s, facing)
  else if (look.accessory === 'sneakers') drawSneakers(ctx, s, facing)
}

// Faixa branca de iniciante na cintura.
function drawBelt(ctx: CanvasRenderingContext2D, s: Skeleton, d: number): void {
  ctx.strokeStyle = '#f2f2f2'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(s.hip.x - 9, s.hip.y - 4)
  ctx.lineTo(s.hip.x + 9, s.hip.y - 4)
  ctx.moveTo(s.hip.x + d * 3, s.hip.y - 4)
  ctx.lineTo(s.hip.x + d * 7, s.hip.y + 10)
  ctx.stroke()
}

function drawBandana(ctx: CanvasRenderingContext2D, s: Skeleton, d: number, tick: number): void {
  const { x, y } = s.head
  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(x - HEAD_RADIUS + 1, y - 7)
  ctx.lineTo(x + HEAD_RADIUS - 1, y - 7)
  ctx.stroke()
  // Duas pontas soltas balançando atrás da cabeça.
  ctx.lineWidth = 3
  for (const [len, phase] of [[20, 0], [15, 1.7]]) {
    const wave = Math.sin(tick * 0.2 + phase) * 4
    ctx.beginPath()
    ctx.moveTo(x - d * (HEAD_RADIUS - 1), y - 7)
    ctx.quadraticCurveTo(x - d * (HEAD_RADIUS + len * 0.6), y - 5 + wave, x - d * (HEAD_RADIUS + len), y + 1 - wave)
    ctx.stroke()
  }
}

function drawSneakers(ctx: CanvasRenderingContext2D, s: Skeleton, d: number): void {
  ctx.fillStyle = '#f2f2f2'
  for (const foot of [s.footFront, s.footBack]) {
    ctx.beginPath()
    ctx.ellipse(foot.x + d * 4, foot.y - 2, 8, 4.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Casco nas costas: uma curva do pescoço ao quadril, estufada para trás.
function drawShell(ctx: CanvasRenderingContext2D, s: Skeleton, d: number, color: string): void {
  const neck = s.neck
  const hip = s.hip
  const len = Math.hypot(hip.x - neck.x, hip.y - neck.y) || 1
  // Perpendicular à coluna, apontando para as costas.
  let perp: Vec = { x: -(hip.y - neck.y) / len, y: (hip.x - neck.x) / len }
  if (perp.x * -d < 0) perp = { x: -perp.x, y: -perp.y }
  const at = (t: number, bulge: number): Vec => ({
    x: neck.x + (hip.x - neck.x) * t + perp.x * bulge,
    y: neck.y + (hip.y - neck.y) * t + perp.y * bulge,
  })
  const top = at(-0.08, 0)
  const bottom = at(1.05, 0)
  const control = at(0.5, 62)

  ctx.fillStyle = '#4a3a2c'
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(top.x, top.y)
  ctx.quadraticCurveTo(control.x, control.y, bottom.x, bottom.y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Faixas do casco.
  ctx.lineWidth = 2
  ctx.beginPath()
  for (const t of [0.3, 0.5, 0.7]) {
    const from = at(t, 0)
    const to = at(t, 31 * (1 - Math.abs(t - 0.5) * 1.2))
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
  }
  ctx.stroke()
}

// Aviso do bot por cima da cabeça: "!" piscando antes de atacar, gotinhas quando cansado.
export function drawTell(ctx: CanvasRenderingContext2D, s: Skeleton, tell: Tell, f: Fighter, tick: number): void {
  if (!tell || f.ko) return
  const { x, y } = s.head
  if (tell === 'tired') {
    ctx.fillStyle = '#7cc4ff'
    for (const [dx, phase] of [[-16, 0], [16, 0.5]]) {
      const t = (tick * 0.03 + phase) % 1
      drawDrop(ctx, x + dx * f.facing, y - 6 + t * 18, 1 - t)
    }
    return
  }
  if (tick % 12 >= 8) return
  ctx.fillStyle = '#ffd166'
  ctx.font = 'bold 26px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('!', x, y - HEAD_RADIUS - 8)
}

function drawDrop(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  ctx.globalAlpha = Math.max(0, alpha)
  ctx.beginPath()
  ctx.moveTo(x, y - 8)
  ctx.quadraticCurveTo(x + 5, y, x, y + 3)
  ctx.quadraticCurveTo(x - 5, y, x, y - 8)
  ctx.fill()
  ctx.globalAlpha = 1
}
