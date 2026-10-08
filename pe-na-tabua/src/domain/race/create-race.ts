import { createRng } from '../random'
import type { Track } from '../track/types'
import { COP_SPEED_FACTOR, PATROL_X } from '../police/constants'
import { createTraffic } from '../traffic/create-traffic'
import { COUNTDOWN, GRID_FRONT_S, GRID_HALF_SPACING, GRID_ROW_GAP, MAX_HEALTH } from './constants'
import type { RiderSetup } from './roster'
import type { Race, Rider } from './types'

// Corredores largam no grid na ordem do roster; policiais esperam no ponto de patrulha.
export function createRace(track: Track, roster: RiderSetup[], seed: number): Race {
  const riders = roster.map((setup, i) => createRider(i, setup, setup.patrolAt === undefined ? gridSlot(i) : patrolSlot(track, setup.patrolAt)))
  const player = riders.find((r) => r.ai === null)
  if (!player) throw new Error('O grid precisa de um jogador')
  const rng = createRng(seed)
  return {
    track,
    riders,
    cars: createTraffic(track.length, rng),
    playerId: player.id,
    phase: 'countdown',
    countdown: COUNTDOWN,
    time: 0,
    finishOrder: [],
    bustTimer: 0,
    rng,
  }
}

export function createRider(id: number, setup: RiderSetup, slot: { s: number; x: number }): Rider {
  return {
    id,
    name: setup.name,
    ai: setup.ai,
    role: setup.role ?? 'racer',
    speedFactor: setup.role === 'cop' ? COP_SPEED_FACTOR : 1,
    chasing: false,
    s: slot.s,
    x: slot.x,
    speed: 0,
    steer: 0,
    pushVel: 0,
    health: MAX_HEALTH,
    crashTimer: 0,
    grace: 0,
    crashSide: 1,
    scraping: false,
    attack: null,
    weapon: setup.weapon ?? null,
    cooldown: 0,
    finishTime: null,
  }
}

function patrolSlot(track: Track, patrolAt: number): { s: number; x: number } {
  return { s: track.finishS * patrolAt, x: PATROL_X }
}

// Grid em duas colunas, fileiras de trás para a frente.
function gridSlot(index: number): { s: number; x: number } {
  const row = Math.floor(index / 2)
  const column = index % 2 === 0 ? -1 : 1
  return { s: GRID_FRONT_S - row * GRID_ROW_GAP, x: column * GRID_HALF_SPACING }
}
