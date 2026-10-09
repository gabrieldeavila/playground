import type { RaceRules } from '../race/rules'

export type DifficultyId = 'joyride' | 'racer' | 'outlaw'

// Cada modo tem a sua carreira. `intensity[n - 1]` é o quanto o nível n aperta (ver challenge.ts).
export interface Difficulty {
  id: DifficultyId
  name: string
  blurb: string
  intensity: number[]
  qualifyPlace: number // chegar nessa posição ou melhor passa de fase
  rules: Pick<RaceRules, 'canBust' | 'catchUp'>
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: 'joyride',
    name: 'Joyride',
    blurb: 'Just ride. Cops chase but never arrest you.',
    intensity: [0, 0.08, 0.16, 0.24, 0.32],
    qualifyPlace: 5,
    rules: { canBust: false, catchUp: 0.08 },
  },
  {
    id: 'racer',
    name: 'Racer',
    blurb: 'A fair fight. The last level is as tough as Outlaw begins.',
    intensity: [0.4, 0.48, 0.62, 0.8, 1],
    qualifyPlace: 3,
    rules: { canBust: true, catchUp: 0 },
  },
  {
    id: 'outlaw',
    name: 'Outlaw',
    blurb: 'No mercy. Hard to finish.',
    intensity: [1, 2, 3, 4, 5],
    qualifyPlace: 3,
    rules: { canBust: true, catchUp: 0 },
  },
]

export function difficultyById(id: DifficultyId): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id)!
}
