import { createRider } from './create-race'
import type { Rider, RiderInput } from './types'

// Fábricas usadas só pelos testes.
export function testRider(id: number, overrides: Partial<Rider> = {}): Rider {
  return { ...createRider(id, { name: `R${id}`, ai: null }, { s: 100, x: 0 }), ...overrides }
}

export function testInput(overrides: Partial<RiderInput> = {}): RiderInput {
  return { throttle: 0, brake: 0, steer: 0, punch: false, kick: false, ...overrides }
}
