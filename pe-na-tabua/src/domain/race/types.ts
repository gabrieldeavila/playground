import type { Rng } from '../random'
import type { Track } from '../track/types'
import type { Car, CarKind } from '../traffic/types'

export interface RiderInput {
  throttle: number // 0..1
  brake: number // 0..1
  steer: number // -1 (esquerda) .. 1 (direita)
  punch: boolean
  kick: boolean
}

export type WeaponKind = 'club' | 'chain'
// Soco com arma na mão vira golpe de arma.
export type AttackKind = 'punch' | 'kick' | WeaponKind
export type Move = 'punch' | 'kick' // o que o controle pede
export type Side = -1 | 1
export type Role = 'racer' | 'cop' // policial não corre: caça o jogador

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
  role: Role
  speedFactor: number // multiplica a velocidade máxima (moto melhor, polícia)
  chasing: boolean // policial: já viu o jogador e está atrás dele
  s: number
  x: number
  speed: number
  steer: number
  pushVel: number // empurrão lateral de golpes e esbarrões (m/s)
  health: number
  crashTimer: number // > 0 enquanto está caído
  grace: number // > 0 logo depois de subir de volta: carros não derrubam
  crashSide: Side
  scraping: boolean // encostado no guard-rail neste passo
  attack: Attack | null
  weapon: WeaponKind | null
  cooldown: number
  finishTime: number | null
}

export type RacePhase = 'countdown' | 'racing' | 'finished' | 'busted'

export type RaceEvent =
  | { kind: 'hit'; attackerId: number; targetId: number; attack: AttackKind }
  | { kind: 'knockout'; attackerId: number; targetId: number }
  | { kind: 'disarm'; attackerId: number; targetId: number; weapon: WeaponKind } // atacante tomou a arma do alvo
  | { kind: 'crash'; riderId: number; car: CarKind | null } // car = em quem bateu, se foi num carro
  | { kind: 'finish'; riderId: number; place: number }
  | { kind: 'chase'; copId: number } // policial saiu atrás do jogador
  | { kind: 'busted'; copId: number }

export interface Race {
  track: Track
  riders: Rider[]
  cars: Car[]
  playerId: number
  phase: RacePhase
  countdown: number
  time: number
  finishOrder: number[]
  bustTimer: number // há quanto tempo um policial está em cima do jogador parado (s)
  rng: Rng
}
