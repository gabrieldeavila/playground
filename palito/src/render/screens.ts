import type { Tell } from '../bots/controller'
import type { MatchResult } from '../campaign/match'
import { isUnlocked } from '../campaign/progress'
import type { Progress } from '../campaign/progress'
import { STAGES } from '../campaign/stages'
import type { Stage } from '../campaign/stages'
import { ARENA_HEIGHT, ARENA_WIDTH } from '../sim/constants'
import { createFighter } from '../sim/world'
import { PALETTES, drawArena } from './arena'
import { poseFighter } from './pose'
import { PLAYER_LOOK, drawStickman, drawTell } from './stickman'
import type { Look } from './stickman'

const TEXT = '#e8eaf0'
const MUTED = '#9aa3b5'
const FAINT = '#6b7385'
const GOLD = '#ffd166'

// Mapa: a torre, um andar por fase, de baixo para cima.
const TOWER_X = 310
const TOWER_WIDTH = 340
const FLOOR_HEIGHT = 74
const TOWER_BOTTOM = 505

export function floorY(index: number): number {
  return TOWER_BOTTOM - (index + 1) * FLOOR_HEIGHT
}

export function drawMap(ctx: CanvasRenderingContext2D, progress: Progress, selected: number, tick: number): void {
  ctx.fillStyle = '#111318'
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT)

  ctx.textAlign = 'left'
  ctx.fillStyle = TEXT
  ctx.font = 'bold 34px system-ui, sans-serif'
  ctx.fillText('TORRE DO PALITO', 40, 62)
  const total = STAGES.reduce((sum, s) => sum + (progress.stars[s.id] ?? 0), 0)
  drawStar(ctx, 52, 92, 9, true)
  ctx.font = 'bold 16px system-ui, sans-serif'
  ctx.fillStyle = GOLD
  ctx.fillText(`${total} / ${STAGES.length * 3}`, 68, 98)

  ctx.font = '14px system-ui, sans-serif'
  ctx.fillStyle = FAINT
  wrapText(ctx, 'Suba a torre derrotando um bot por andar. Cada um tem um jeito de lutar: aprenda a ler os avisos dele.', 40, 140, 230, 20)
  ctx.fillText('↑ ↓  escolher andar', 40, 470)
  ctx.fillText('Enter  lutar', 40, 492)

  // Topo da torre: os próximos andares ainda não existem.
  const topY = floorY(STAGES.length - 1)
  ctx.strokeStyle = '#2a2d35'
  ctx.setLineDash([6, 6])
  ctx.lineWidth = 2
  ctx.strokeRect(TOWER_X, topY - 46, TOWER_WIDTH, 36)
  ctx.setLineDash([])
  ctx.fillStyle = FAINT
  ctx.textAlign = 'center'
  ctx.font = '13px system-ui, sans-serif'
  ctx.fillText('mais andares em breve…', TOWER_X + TOWER_WIDTH / 2, topY - 23)

  STAGES.forEach((stage, i) => drawFloor(ctx, stage, i, progress, i === selected, tick))

  // Você, do lado do andar escolhido.
  const y = floorY(selected) + FLOOR_HEIGHT - 10
  drawFigure(ctx, PLAYER_LOOK, TOWER_X - 34, y, 0.42, 1, tick)

  drawStageInfo(ctx, STAGES[selected], selected, progress)
}

function drawFloor(ctx: CanvasRenderingContext2D, stage: Stage, index: number, progress: Progress, selected: boolean, tick: number): void {
  const y = floorY(index)
  const unlocked = isUnlocked(progress, index)
  const palette = PALETTES[stage.arena]

  ctx.fillStyle = unlocked ? palette.skyBottom : '#1a1c22'
  ctx.fillRect(TOWER_X, y, TOWER_WIDTH, FLOOR_HEIGHT - 6)
  ctx.lineWidth = selected ? 3 : 1
  ctx.strokeStyle = selected ? (unlocked ? stage.look.color : MUTED) : '#2a2d35'
  ctx.strokeRect(TOWER_X, y, TOWER_WIDTH, FLOOR_HEIGHT - 6)

  ctx.textAlign = 'left'
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.fillStyle = FAINT
  ctx.fillText(String(index + 1), TOWER_X + 10, y + 20)

  if (!unlocked) {
    drawLock(ctx, TOWER_X + 52, y + 36)
    ctx.font = 'bold 18px system-ui, sans-serif'
    ctx.fillStyle = FAINT
    ctx.fillText('???', TOWER_X + 90, y + 42)
    return
  }

  drawFigure(ctx, stage.look, TOWER_X + 52, y + FLOOR_HEIGHT - 12, 0.38, -1, selected ? tick : 0)
  ctx.font = 'bold 18px system-ui, sans-serif'
  ctx.fillStyle = TEXT
  ctx.fillText(stage.name, TOWER_X + 90, y + 32)
  ctx.font = '13px system-ui, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText(stage.title, TOWER_X + 90, y + 52)

  const stars = progress.stars[stage.id] ?? 0
  for (let s = 0; s < 3; s++) drawStar(ctx, TOWER_X + TOWER_WIDTH - 70 + s * 24, y + 34, 9, s < stars)
}

function drawStageInfo(ctx: CanvasRenderingContext2D, stage: Stage, index: number, progress: Progress): void {
  const x = 690
  ctx.textAlign = 'left'
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.fillStyle = FAINT
  ctx.fillText(`ANDAR ${index + 1}`, x, 200)
  if (!isUnlocked(progress, index)) {
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillStyle = MUTED
    ctx.fillText('Trancado', x, 236)
    ctx.font = '14px system-ui, sans-serif'
    ctx.fillStyle = FAINT
    wrapText(ctx, 'Vença o andar de baixo para liberar.', x, 264, 240, 20)
    return
  }
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.fillStyle = stage.look.color
  ctx.fillText(stage.name, x, 238)
  ctx.font = 'italic 15px system-ui, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText(stage.title, x, 264)
  ctx.font = 'bold 16px system-ui, sans-serif'
  ctx.fillStyle = TEXT
  ctx.fillText('Enter para lutar', x, 310)
}

export function drawIntro(ctx: CanvasRenderingContext2D, stage: Stage, index: number, showTip: boolean, tick: number): void {
  drawArena(ctx, stage.arena)
  ctx.fillStyle = 'rgba(10, 11, 15, 0.55)'
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT)

  // De vez em quando o bot mostra o aviso dele: a apresentação já ensina o que olhar.
  const tell = demoTell(stage, tick)
  drawFigure(ctx, stage.look, 720, 470, 2.1, -1, tick, tell)

  ctx.textAlign = 'left'
  ctx.font = 'bold 14px system-ui, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText(`ANDAR ${index + 1}`, 60, 110)
  ctx.font = 'bold 76px system-ui, sans-serif'
  ctx.fillStyle = stage.look.color
  ctx.fillText(stage.name.toUpperCase(), 56, 186)
  ctx.font = 'italic 20px system-ui, sans-serif'
  ctx.fillStyle = TEXT
  ctx.fillText(stage.title, 60, 220)
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.fillStyle = TEXT
  wrapText(ctx, `“${stage.taunt}”`, 60, 290, 440, 30)

  if (showTip) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.1)'
    ctx.fillRect(56, 360, 450, 86)
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillStyle = GOLD
    ctx.fillText('DICA', 70, 382)
    ctx.font = '15px system-ui, sans-serif'
    ctx.fillStyle = TEXT
    wrapText(ctx, stage.tip, 70, 404, 425, 20)
  }

  ctx.font = '15px system-ui, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText('Enter: lutar · Esc: voltar', 60, 500)
}

function demoTell(stage: Stage, tick: number): Tell {
  if (tick % 150 < 100) return null
  const tells: Record<string, Tell> = { brigao: 'punch', chutador: 'kick', tatu: 'kick', pulador: 'jump' }
  return tells[stage.id] ?? 'punch'
}

export function drawResult(
  ctx: CanvasRenderingContext2D,
  stage: Stage,
  result: MatchResult,
  info: { unlockedNext: boolean; firstLoss: boolean },
  tick: number,
): void {
  ctx.fillStyle = 'rgba(10, 11, 15, 0.8)'
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT)
  const cx = ARENA_WIDTH / 2
  ctx.textAlign = 'center'
  ctx.font = 'bold 68px system-ui, sans-serif'
  ctx.fillStyle = result.won ? GOLD : '#ff6b6b'
  ctx.fillText(result.won ? 'VITÓRIA!' : 'DERROTA', cx, 130)

  if (result.won) {
    // As estrelas entram uma por uma.
    for (let s = 0; s < 3; s++) {
      const shown = tick > 20 + s * 18
      const pop = shown ? Math.min(1, (tick - 20 - s * 18) / 8) : 1
      drawStar(ctx, cx - 70 + s * 70, 200, 26 * (shown ? 0.6 + 0.4 * pop : 1), shown && s < result.stars)
    }
    const goals: [string, boolean][] = [
      ['Vencer', true],
      ['Não perder nenhum round', result.noRoundLost],
      ['Vencer os rounds com 70% de vida ou mais', result.healthy],
    ]
    ctx.font = '16px system-ui, sans-serif'
    goals.forEach(([text, done], i) => {
      ctx.fillStyle = done ? TEXT : FAINT
      ctx.fillText(`${done ? '✓' : '·'}  ${text}`, cx, 270 + i * 26)
    })
    if (info.unlockedNext) {
      ctx.font = 'bold 18px system-ui, sans-serif'
      ctx.fillStyle = GOLD
      ctx.fillText('Andar novo liberado!', cx, 375)
    }
  } else {
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.fillStyle = stage.look.color
    ctx.fillText(`${stage.name}: “${stage.gloat}”`, cx, 210)
    if (info.firstLoss) {
      ctx.font = '16px system-ui, sans-serif'
      ctx.fillStyle = GOLD
      ctx.fillText('Dica liberada na apresentação dele.', cx, 260)
    }
  }

  ctx.font = '16px system-ui, sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText('Enter: voltar à torre · R: lutar de novo', cx, 450)
}

// Um palito parado em qualquer escala, com os pés em (x, y).
function drawFigure(
  ctx: CanvasRenderingContext2D,
  look: Look,
  x: number,
  y: number,
  scale: number,
  facing: 1 | -1,
  tick: number,
  tell: Tell = null,
): void {
  const f = createFighter(0, facing)
  f.y = 0
  const pose = poseFighter(f, tick, tell)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  drawStickman(ctx, pose, look, facing, tick)
  drawTell(ctx, pose, tell, f, tick)
  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, filled: boolean): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const radius = i % 2 === 0 ? r : r * 0.45
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
  }
  ctx.closePath()
  if (filled) {
    ctx.fillStyle = GOLD
    ctx.fill()
  } else {
    ctx.strokeStyle = '#3a4152'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

function drawLock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = FAINT
  ctx.fillStyle = FAINT
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y - 6, 7, Math.PI, 0)
  ctx.stroke()
  ctx.fillRect(x - 10, y - 6, 20, 16)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      y += lineHeight
      line = word
    } else {
      line = next
    }
  }
  ctx.fillText(line, x, y)
}
