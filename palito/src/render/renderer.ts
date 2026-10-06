import type { Tell } from '../bots/controller'
import { ARENA_HEIGHT, ARENA_WIDTH, FLOOR_Y, MAX_HP, TICK_RATE } from '../sim/constants'
import type { World } from '../sim/types'
import { drawArena } from './arena'
import type { ArenaTheme } from './arena'
import { poseFighter } from './pose'
import type { Skeleton } from './pose'
import { Ragdoll } from './ragdoll'
import { drawStickman, drawTell } from './stickman'
import type { Look } from './stickman'

export const CONTROL_HINT = 'Mover: WASD ou setas · Soco: F/J · Chute: G/K · Defesa: H/L · Esc: pausa'
const ROUNDS_TO_WIN = 2
const TRAIL_LENGTH = 6

// Quem está lutando e onde: muda a cada luta.
export interface FightSetup {
  names: [string, string]
  looks: [Look, Look]
  arena: ArenaTheme
}

// O que muda a cada quadro além do mundo.
export interface FightHud {
  tells: [Tell, Tell]
  wins: [number, number]
  banner: string | null
  paused: boolean
  // Fim da luta: a tela de resultado cobre o "KO!" do round.
  matchOver: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

export class Renderer {
  setup: FightSetup | null = null
  private ragdolls: [Ragdoll | null, Ragdoll | null] = [null, null]
  private particles: Particle[] = []
  private trails: [Skeleton[], Skeleton[]] = [[], []]
  private shake = 0
  private flash = [0, 0]
  // Barra "fantasma" que desce devagar atrás da vida real.
  private trailingHp = [MAX_HP, MAX_HP]

  constructor(private ctx: CanvasRenderingContext2D) {}

  reset(): void {
    this.ragdolls = [null, null]
    this.particles = []
    this.trails = [[], []]
    this.shake = 0
    this.flash = [0, 0]
    this.trailingHp = [MAX_HP, MAX_HP]
  }

  // Chamado uma vez por tick da simulação.
  onStep(world: World, tells: [Tell, Tell]): void {
    for (const e of world.events) {
      const defender = 1 - e.attacker
      const count = e.blocked ? 5 : 12
      const color = e.blocked ? '#cfe8ff' : '#ffd166'
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * (e.blocked ? 3 : 6)
        this.particles.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
        })
      }
      this.shake = Math.max(this.shake, e.blocked ? 2 : e.kind === 'kick' ? 9 : 5)
      if (!e.blocked) this.flash[defender] = 6
    }

    world.fighters.forEach((f, i) => {
      if (f.ko && !this.ragdolls[i]) this.ragdolls[i] = new Ragdoll(poseFighter(f, world.tick), f.vx)
      this.ragdolls[i]?.step()
      if (this.flash[i] > 0) this.flash[i]--
      this.trailingHp[i] = Math.max(f.hp, this.trailingHp[i] - 0.4)

      // Rastro: guarda as últimas poses enquanto está no ar e some aos poucos no chão.
      if (this.setup?.looks[i].accessory === 'trail' && world.hitStop === 0) {
        const trail = this.trails[i]
        if (!f.onGround && !f.ko && world.tick % 2 === 0) trail.push(poseFighter(f, world.tick, tells[i]))
        else if (f.onGround || world.tick % 2 === 0) trail.shift()
        if (trail.length > TRAIL_LENGTH) trail.shift()
      }
    })

    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.25
      p.vx *= 0.94
      p.life -= 0.04
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    this.shake *= 0.85
  }

  draw(world: World, hud: FightHud): void {
    const setup = this.setup
    if (!setup) return
    const ctx = this.ctx
    ctx.save()
    if (this.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake)
    }

    drawArena(ctx, setup.arena)
    world.fighters.forEach((f, i) => {
      const look = setup.looks[i]
      this.trails[i].forEach((pose, n) => {
        ctx.globalAlpha = ((n + 1) / (TRAIL_LENGTH + 1)) * 0.35
        drawStickman(ctx, pose, look, f.facing, world.tick)
      })
      ctx.globalAlpha = 1

      const tell = f.ko ? null : hud.tells[i]
      const skeleton = this.ragdolls[i]?.skeleton() ?? poseFighter(f, world.tick, tell)
      this.drawShadow(skeleton)
      drawStickman(ctx, skeleton, look, f.facing, world.tick, this.flash[i] > 0 ? '#ffffff' : look.color)
      drawTell(ctx, skeleton, tell, f, world.tick)

      // Escudinho na frente das mãos quando está defendendo.
      if (f.blocking && !f.ko) {
        ctx.strokeStyle = 'rgba(207, 232, 255, 0.5)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(f.x, f.y - 90, 48, f.facing === 1 ? -0.6 : Math.PI - 0.6, f.facing === 1 ? 0.6 : Math.PI + 0.6)
        ctx.stroke()
      }
    })
    this.drawParticles()

    ctx.restore()
    this.drawHud(world, hud, setup)
  }

  private drawShadow(s: Skeleton): void {
    const ctx = this.ctx
    const height = FLOOR_Y - Math.min(s.footFront.y, s.footBack.y)
    const scale = Math.max(0.3, 1 - height / 200)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.beginPath()
    ctx.ellipse(s.hip.x, FLOOR_Y + 2, 26 * scale, 5 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawParticles(): void {
    const ctx = this.ctx
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.strokeStyle = p.color
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  private drawHud(world: World, hud: FightHud, setup: FightSetup): void {
    const ctx = this.ctx
    const barWidth = 360
    const barY = 28

    world.fighters.forEach((f, i) => {
      const left = i === 0
      const x = left ? 40 : ARENA_WIDTH - 40 - barWidth
      ctx.fillStyle = '#2a2d35'
      ctx.fillRect(x, barY, barWidth, 18)
      const trail = (this.trailingHp[i] / MAX_HP) * barWidth
      const hp = (f.hp / MAX_HP) * barWidth
      ctx.fillStyle = '#f0c060'
      ctx.fillRect(left ? x + barWidth - trail : x, barY, trail, 18)
      ctx.fillStyle = setup.looks[i].color
      ctx.fillRect(left ? x + barWidth - hp : x, barY, hp, 18)

      ctx.fillStyle = '#e8eaf0'
      ctx.font = 'bold 14px system-ui, sans-serif'
      ctx.textAlign = left ? 'left' : 'right'
      ctx.fillText(setup.names[i], left ? x : x + barWidth, barY + 36)

      // Bolinhas de rounds vencidos, do lado de dentro da barra.
      for (let r = 0; r < ROUNDS_TO_WIN; r++) {
        const cx = left ? x + barWidth - 8 - r * 20 : x + 8 + r * 20
        ctx.beginPath()
        ctx.arc(cx, barY + 31, 6, 0, Math.PI * 2)
        ctx.fillStyle = r < hud.wins[i] ? '#ffd166' : '#2a2d35'
        ctx.fill()
      }
    })

    ctx.fillStyle = '#e8eaf0'
    ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(Math.max(0, Math.ceil(world.roundTicksLeft / TICK_RATE))), ARENA_WIDTH / 2, barY + 18)

    if (hud.banner) {
      this.bigText(hud.banner, 220, '#ffd166')
    } else if (world.phase === 'over' && !hud.matchOver) {
      const ko = world.fighters.some((f) => f.ko)
      this.bigText(ko ? 'KO!' : 'TEMPO!', 190, '#ffd166')
      ctx.font = 'bold 28px system-ui, sans-serif'
      ctx.fillStyle = world.winner === null ? '#e8eaf0' : setup.looks[world.winner].color
      const line = world.winner === null ? 'EMPATE' : world.winner === 0 ? 'VOCÊ VENCEU O ROUND' : `${setup.names[1]} VENCEU O ROUND`
      ctx.fillText(line, ARENA_WIDTH / 2, 235)
    }

    ctx.font = '13px system-ui, sans-serif'
    ctx.fillStyle = '#6b7385'
    ctx.textAlign = 'center'
    ctx.fillText(CONTROL_HINT, ARENA_WIDTH / 2, ARENA_HEIGHT - 20)

    if (hud.paused) {
      ctx.fillStyle = 'rgba(10, 11, 15, 0.75)'
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT)
      this.bigText('PAUSA', 230, '#e8eaf0')
      ctx.font = '18px system-ui, sans-serif'
      ctx.fillStyle = '#9aa3b5'
      ctx.fillText('Enter: continuar · Esc: desistir e voltar ao mapa', ARENA_WIDTH / 2, 280)
    }
  }

  private bigText(text: string, y: number, color: string): void {
    const ctx = this.ctx
    ctx.font = 'bold 72px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.lineWidth = 8
    ctx.strokeStyle = 'rgba(10, 11, 15, 0.6)'
    ctx.strokeText(text, ARENA_WIDTH / 2, y)
    ctx.fillStyle = color
    ctx.fillText(text, ARENA_WIDTH / 2, y)
  }
}
