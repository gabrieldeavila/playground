import type { Rng } from '../random'
import type { Flight } from './types'

const GRAVITY = 9.8
const LIFT = 2 // m/s para cima, mesmo numa batida devagar
const LIFT_PER_SPEED = 0.06 // m/s para cima por m/s da pancada
const LYING = Math.PI / 2

// Pancada de quem vem a `speed` m/s ao longo da pista: arremessa para frente e para `side`.
export function launch(speed: number, side: -1 | 1, rng: Rng, carry = 0.8): Flight {
  return {
    vs: speed * carry,
    vx: side * (1 + rng() * 2),
    vy: LIFT + Math.abs(speed) * LIFT_PER_SPEED,
    y: 0,
    spin: 7 + rng() * 6,
    angle: 0,
    landed: false,
  }
}

// Anda um passo no ar; ao tocar o chão fica deitado onde caiu. Devolve quanto andou (ds, dx).
export function stepFlight(flight: Flight, dt: number): { ds: number; dx: number } {
  if (flight.landed) return { ds: 0, dx: 0 }
  flight.vy -= GRAVITY * dt
  flight.y += flight.vy * dt
  flight.angle += flight.spin * dt
  const moved = { ds: flight.vs * dt, dx: flight.vx * dt }
  if (flight.y <= 0) land(flight)
  return moved
}

function land(flight: Flight): void {
  flight.y = 0
  flight.vs = 0
  flight.vx = 0
  flight.vy = 0
  flight.spin = 0
  flight.angle = LYING
  flight.landed = true
}
