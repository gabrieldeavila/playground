import type { Rng } from '../random'
import type { Track } from '../track/types'

export interface RiderInput {
  throttle: number // 0..1
  brake: number // 0..1
  steer: number // -1 (esquerda) .. 1 (direita)
  punch: boolean
  kick: boolean
}

export type AttackKind = 'punch' | 'kick'
export type Side = -1 | 1

export interface Attack {
  kind: AttackKind
  side: Side
  elapsed: number
  landed: boolean
}

// Personalidade de um bot.
export interface AiProfile {
  pace: number // fração da velocidade máxima que ele busca
  aggression: number // 0..1: vontade de encostar e bater
  wander: number // frequência com que troca de linha (rad/s)
  phase: number
}

export interface Rider {
  id: number
  name: string
  ai: AiProfile | null // null = jogador
  s: number
  x: number
  speed: number
  steer: number
  pushVel: number // empurrão lateral de golpes e esbarrões (m/s)
  health: number
  crashTimer: number // > 0 enquanto está caído
  crashSide: Side
  attack: Attack | null
  cooldown: number
  finishTime: number | null
}

export type RacePhase = 'countdown' | 'racing' | 'finished'

export type RaceEvent =
  | { kind: 'hit'; attackerId: number; targetId: number; attack: AttackKind }
  | { kind: 'knockout'; attackerId: number; targetId: number }
  | { kind: 'crash'; riderId: number }
  | { kind: 'finish'; riderId: number; place: number }

export interface Race {
  track: Track
  riders: Rider[]
  playerId: number
  phase: RacePhase
  countdown: number
  time: number
  finishOrder: number[]
  rng: Rng
}
