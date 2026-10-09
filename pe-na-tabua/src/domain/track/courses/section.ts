import type { Section } from '../types'

// Atalho para escrever os trechos de uma pista.
export const section = (enter: number, hold: number, leave: number, curve = 0, hill = 0): Section => ({
  enter,
  hold,
  leave,
  curve,
  hill,
})
