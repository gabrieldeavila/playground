export interface Input {
  left: boolean
  right: boolean
  jump: boolean
  crouch: boolean
  punch: boolean
  kick: boolean
  block: boolean
}

export type AttackKind = 'punch' | 'kick'

export interface Attack {
  kind: AttackKind
  tick: number
  hasHit: boolean
}

export interface Fighter {
  // Posição dos pés.
  x: number
  y: number
  vx: number
  vy: number
  facing: 1 | -1
  hp: number
  onGround: boolean
  crouching: boolean
  blocking: boolean
  attack: Attack | null
  hitStun: number
  blockStun: number
  // Distância andada no chão; a animação de caminhada usa isso.
  stride: number
  ko: boolean
}

export type PlayerIndex = 0 | 1

export interface HitEvent {
  attacker: PlayerIndex
  kind: AttackKind
  x: number
  y: number
  blocked: boolean
}

export interface World {
  tick: number
  fighters: [Fighter, Fighter]
  phase: 'fight' | 'over'
  // null com phase 'over' = empate.
  winner: PlayerIndex | null
  roundTicksLeft: number
  hitStop: number
  // Eventos do último step, para a renderização (faíscas, tremida).
  events: HitEvent[]
}

export const EMPTY_INPUT: Input = {
  left: false,
  right: false,
  jump: false,
  crouch: false,
  punch: false,
  kick: false,
  block: false,
}
