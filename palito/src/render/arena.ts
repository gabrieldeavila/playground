import { ARENA_HEIGHT, ARENA_WIDTH, FLOOR_Y } from '../sim/constants'

export type ArenaTheme = 'dojo' | 'alley' | 'park' | 'cave' | 'rooftops'

interface Palette {
  skyTop: string
  skyBottom: string
  floor: string
  floorLine: string
  // Cor das silhuetas do fundo.
  shape: string
}

export const PALETTES: Record<ArenaTheme, Palette> = {
  dojo: { skyTop: '#241c16', skyBottom: '#3a2d22', floor: '#2b2118', floorLine: '#5a4532', shape: '#1b1510' },
  alley: { skyTop: '#16141d', skyBottom: '#2c2433', floor: '#17161c', floorLine: '#3d3546', shape: '#100f15' },
  park: { skyTop: '#0f1a24', skyBottom: '#1f3a3a', floor: '#132219', floorLine: '#2c4a36', shape: '#0b1517' },
  cave: { skyTop: '#130f0b', skyBottom: '#2a2218', floor: '#16120e', floorLine: '#3d3122', shape: '#0d0a07' },
  rooftops: { skyTop: '#0d1530', skyBottom: '#3b3a6b', floor: '#1a1c26', floorLine: '#444a66', shape: '#0c0e18' },
}

// Pseudoaleatório fixo: o cenário sai sempre igual, sem guardar nada.
function rand(i: number): number {
  const v = Math.sin(i * 12.9898) * 43758.5453
  return v - Math.floor(v)
}

export function drawArena(ctx: CanvasRenderingContext2D, theme: ArenaTheme): void {
  const p = PALETTES[theme]
  const sky = ctx.createLinearGradient(0, 0, 0, FLOOR_Y)
  sky.addColorStop(0, p.skyTop)
  sky.addColorStop(1, p.skyBottom)
  ctx.fillStyle = sky
  ctx.fillRect(-20, -20, ARENA_WIDTH + 40, FLOOR_Y + 20)

  ctx.fillStyle = p.shape
  ctx.strokeStyle = p.shape
  SCENERY[theme](ctx, p)

  ctx.fillStyle = p.floor
  ctx.fillRect(-20, FLOOR_Y, ARENA_WIDTH + 40, ARENA_HEIGHT - FLOOR_Y + 20)
  ctx.strokeStyle = p.floorLine
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-20, FLOOR_Y)
  ctx.lineTo(ARENA_WIDTH + 20, FLOOR_Y)
  ctx.stroke()
}

const SCENERY: Record<ArenaTheme, (ctx: CanvasRenderingContext2D, p: Palette) => void> = {
  // Academia: painéis de madeira na parede e uma flâmula com um palito.
  dojo(ctx, p) {
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let x = 60; x < ARENA_WIDTH; x += 140) {
      ctx.moveTo(x, 120)
      ctx.lineTo(x, FLOOR_Y)
    }
    ctx.moveTo(0, 120)
    ctx.lineTo(ARENA_WIDTH, 120)
    ctx.stroke()
    ctx.fillRect(ARENA_WIDTH / 2 - 50, 140, 100, 150)
    ctx.strokeStyle = p.floorLine
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(ARENA_WIDTH / 2, 180, 12, 0, Math.PI * 2)
    ctx.moveTo(ARENA_WIDTH / 2, 192)
    ctx.lineTo(ARENA_WIDTH / 2, 240)
    ctx.lineTo(ARENA_WIDTH / 2 - 16, 272)
    ctx.moveTo(ARENA_WIDTH / 2, 240)
    ctx.lineTo(ARENA_WIDTH / 2 + 16, 272)
    ctx.moveTo(ARENA_WIDTH / 2 - 22, 205)
    ctx.lineTo(ARENA_WIDTH / 2 + 22, 205)
    ctx.stroke()
  },

  // Beco: prédios com algumas janelas acesas.
  alley(ctx) {
    let x = -20
    for (let i = 0; x < ARENA_WIDTH + 20; i++) {
      const w = 110 + rand(i) * 90
      const top = 90 + rand(i + 50) * 160
      ctx.fillStyle = i % 2 ? '#100f15' : '#141219'
      ctx.fillRect(x, top, w - 6, FLOOR_Y - top)
      for (let wy = top + 24; wy < FLOOR_Y - 40; wy += 38) {
        for (let wx = x + 16; wx < x + w - 30; wx += 30) {
          const lit = rand(wx * 7 + wy) > 0.78
          ctx.fillStyle = lit ? 'rgba(240, 192, 96, 0.35)' : 'rgba(255, 255, 255, 0.03)'
          ctx.fillRect(wx, wy, 14, 20)
        }
      }
      x += w
    }
  },

  // Parque à noite: lua e árvores.
  park(ctx) {
    ctx.fillStyle = 'rgba(230, 236, 210, 0.85)'
    ctx.beginPath()
    ctx.arc(780, 110, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0b1517'
    for (let i = 0; i < 7; i++) {
      const x = 40 + i * 145 + rand(i) * 40
      const h = 150 + rand(i + 9) * 110
      ctx.fillRect(x - 6, FLOOR_Y - h, 12, h)
      for (let j = 0; j < 4; j++) {
        ctx.beginPath()
        ctx.arc(x + (rand(i * 4 + j) - 0.5) * 60, FLOOR_Y - h - rand(i * 4 + j + 30) * 40, 32 + rand(i + j) * 16, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  },

  // Toca do Tatu: estalactites no teto e pedras no chão.
  cave(ctx) {
    ctx.beginPath()
    for (let i = 0; i < 24; i++) {
      const x = i * 42 + rand(i) * 20
      const len = 30 + rand(i + 3) * 90
      ctx.moveTo(x - 16, -10)
      ctx.lineTo(x, len)
      ctx.lineTo(x + 16, -10)
    }
    ctx.fill()
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const x = rand(i + 70) * ARENA_WIDTH
      ctx.ellipse(x, FLOOR_Y, 30 + rand(i) * 40, 14 + rand(i + 5) * 22, 0, Math.PI, 0)
    }
    ctx.fill()
  },

  // Telhados: estrelas, caixas d'água e antenas.
  rooftops(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    for (let i = 0; i < 50; i++) ctx.fillRect(rand(i) * ARENA_WIDTH, rand(i + 100) * 260, 2, 2)
    ctx.fillStyle = '#0c0e18'
    ctx.strokeStyle = '#0c0e18'
    ctx.lineWidth = 3
    let x = -20
    for (let i = 0; x < ARENA_WIDTH + 20; i++) {
      const w = 140 + rand(i + 20) * 120
      const top = 300 + rand(i + 40) * 90
      ctx.fillRect(x, top, w - 20, FLOOR_Y - top)
      if (rand(i + 60) > 0.5) {
        ctx.fillRect(x + 20, top - 40, 36, 40)
      } else {
        ctx.beginPath()
        ctx.moveTo(x + w / 2, top)
        ctx.lineTo(x + w / 2, top - 70)
        ctx.moveTo(x + w / 2 - 16, top - 55)
        ctx.lineTo(x + w / 2 + 16, top - 55)
        ctx.stroke()
      }
      x += w
    }
  },
}
