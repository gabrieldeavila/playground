import type { AiProfile, WeaponKind } from './types'

export interface RiderSetup {
  name: string
  ai: AiProfile | null
  weapon?: WeaponKind
}

const bot = (name: string, pace: number, aggression: number, wander: number, phase: number, weapon?: WeaponKind): RiderSetup => ({
  name,
  ai: { pace, aggression, wander, phase },
  weapon,
})

// Ordem = posição no grid (o jogador larga lá atrás, de mãos vazias).
export const ROSTER: RiderSetup[] = [
  bot('Viper', 0.97, 0.7, 0.35, 0, 'chain'),
  bot('Mara', 0.95, 0.2, 0.5, 1.3),
  bot('Dutch', 0.93, 0.8, 0.3, 2.1, 'club'),
  bot('Kenji', 0.96, 0.4, 0.45, 3.4),
  bot('Lola', 0.91, 0.6, 0.6, 0.7),
  bot('Brick', 0.94, 0.9, 0.25, 4.2, 'club'),
  { name: 'You', ai: null },
  bot('Sully', 0.9, 0.5, 0.4, 5.5),
]
