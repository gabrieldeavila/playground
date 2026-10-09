import type { Car } from './types'

// Fábrica usada só pelos testes: um sedã na faixa 1 (x = 1,6, mesmo sentido da corrida).
export function testCar(overrides: Partial<Car> = {}): Car {
  return { id: 0, kind: 'sedan', s: 100, x: 1.6, speed: 22, direction: 1, lane: 1, change: null, changeTimer: 99, ...overrides }
}
