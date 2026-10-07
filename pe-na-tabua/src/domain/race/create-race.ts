import { createRng } from '../random'
import type { Track } from '../track/types'
import { COUNTDOWN, GRID_FRONT_S, GRID_HALF_SPACING, GRID_ROW_GAP, MAX_HEALTH } from './constants'
import type { RiderSetup } from './roster'
import type { Race, Rider } from './types'

export function createRace(track: Track, roster: RiderSetup[], seed: number): Race {
  const riders = roster.map((setup, i) => createRider(i, setup, gridSlot(i)))
  const player = riders.find((r) => r.ai === null)
  if (!player) throw new Error('O grid precisa de um jogador')
  return {
    track,
    riders,
    playerId: player.id,
    phase: 'countdown',
    countdown: COUNTDOWN,
    time: 0,
    finishOrder: [],
    rng: createRng(seed),
  }
}

export function createRider(id: number, setup: RiderSetup, slot: { s: number; x: number }): Rider {
  return {
    id,
    name: setup.name,
    ai: setup.ai,
    s: slot.s,
    x: slot.x,
    speed: 0,
    steer: 0,
    pushVel: 0,
    health: MAX_HEALTH,
    crashTimer: 0,
    crashSide: 1,
    attack: null,
    cooldown: 0,
    finishTime: null,
  }
}

// Grid em duas colunas, fileiras de trás para a frente.
function gridSlot(index: number): { s: number; x: number } {
  const row = Math.floor(index / 2)
  const column = index % 2 === 0 ? -1 : 1
  return { s: GRID_FRONT_S - row * GRID_ROW_GAP, x: column * GRID_HALF_SPACING }
}
