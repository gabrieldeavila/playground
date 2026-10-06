import { ARENA_WIDTH, FLOOR_Y, WALL_MARGIN } from '../sim/constants'
import { BONES, HEAD_RADIUS } from './pose'
import type { Joint, Skeleton } from './pose'

interface Point {
  x: number
  y: number
  px: number
  py: number
  radius: number
}

interface Stick {
  a: Joint
  b: Joint
  length: number
}

const GRAVITY = 0.5
const AIR_DRAG = 0.99
const FLOOR_FRICTION = 0.7
const ITERATIONS = 5
const UPPER_BODY: Joint[] = ['head', 'neck', 'elbowFront', 'handFront', 'elbowBack', 'handBack']

// Boneco mole do nocaute (Verlet): só visual, não afeta a simulação.
export class Ragdoll {
  private points = {} as Record<Joint, Point>
  private sticks: Stick[] = []

  constructor(pose: Skeleton, vx: number) {
    for (const [joint, p] of Object.entries(pose) as [Joint, { x: number; y: number }][]) {
      // Velocidade inicial = (x - px): arremessa na direção do golpe, parte de cima subindo.
      const lift = UPPER_BODY.includes(joint) ? 5 : 1.5
      this.points[joint] = {
        x: p.x,
        y: p.y,
        px: p.x - vx * 1.6,
        py: p.y + lift,
        radius: joint === 'head' ? HEAD_RADIUS : 3,
      }
    }
    // Cabeça-quadril segura o tronco para não dobrar ao meio.
    for (const [a, b] of [...BONES, ['head', 'hip'] as [Joint, Joint]]) {
      this.sticks.push({ a, b, length: distance(this.points[a], this.points[b]) })
    }
  }

  step(): void {
    for (const p of Object.values(this.points)) {
      const vx = (p.x - p.px) * AIR_DRAG
      const vy = (p.y - p.py) * AIR_DRAG
      p.px = p.x
      p.py = p.y
      p.x += vx
      p.y += vy + GRAVITY
    }

    for (let i = 0; i < ITERATIONS; i++) {
      for (const s of this.sticks) {
        const a = this.points[s.a]
        const b = this.points[s.b]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 0.001
        const diff = (dist - s.length) / dist / 2
        a.x += dx * diff
        a.y += dy * diff
        b.x -= dx * diff
        b.y -= dy * diff
      }
      for (const p of Object.values(this.points)) this.collide(p)
    }
  }

  skeleton(): Skeleton {
    const out = {} as Skeleton
    for (const [joint, p] of Object.entries(this.points) as [Joint, Point][]) out[joint] = { x: p.x, y: p.y }
    return out
  }

  private collide(p: Point): void {
    const floor = FLOOR_Y - p.radius
    if (p.y > floor) {
      p.y = floor
      p.px = p.x - (p.x - p.px) * FLOOR_FRICTION
    }
    const minX = WALL_MARGIN - 20 + p.radius
    const maxX = ARENA_WIDTH - WALL_MARGIN + 20 - p.radius
    if (p.x < minX) p.x = minX
    if (p.x > maxX) p.x = maxX
  }
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
