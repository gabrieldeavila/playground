import type { Career } from '../domain/career/career'
import { challengeAt } from '../domain/career/challenge'
import type { Difficulty } from '../domain/career/difficulty'
import type { Level } from '../domain/career/levels'

export type LevelState = 'cleared' | 'next' | 'locked'

export interface LevelRow {
  number: number
  cops: number
  qualifyPlace: number
  state: LevelState
  progress: string // pistas passadas no nível atual: "1/2"; vazio nos outros
}

// Uma linha por nível na tela de escolha: polícia e posição para passar, no modo escolhido.
export function levelRows(career: Career, levels: Level[], courseCount: number, difficulty: Difficulty): LevelRow[] {
  return levels.map((level) => {
    const state = stateOf(level.number, career)
    return {
      number: level.number,
      cops: challengeAt(difficulty.intensity[level.number - 1]).cops,
      qualifyPlace: difficulty.qualifyPlace,
      state,
      progress: state === 'next' && courseCount > 1 ? `${career.cleared.length}/${courseCount}` : '',
    }
  })
}

function stateOf(number: number, career: Career): LevelState {
  if (number > career.level) return 'locked'
  return number < career.level || career.champion ? 'cleared' : 'next'
}
