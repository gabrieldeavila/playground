import { createRng } from '../random'
import { SIDEWALK_X } from './constants'
import type { Cone, Pedestrian, Street } from './types'

// Fábricas usadas só pelos testes.
export function testPedestrian(overrides: Partial<Pedestrian> = {}): Pedestrian {
  return { id: 0, s: 200, x: -SIDEWALK_X, side: -1, walkSpeed: 1.6, state: 'waiting', timer: 0, flight: null, ...overrides }
}

export function testCone(overrides: Partial<Cone> = {}): Cone {
  return { id: 0, s: 200, x: 0, flight: null, ...overrides }
}

export function testStreet(overrides: Partial<Street> = {}): Street {
  return { crosswalks: [], potholes: [], cones: [], pedestrians: [], rng: createRng(1), ...overrides }
}
