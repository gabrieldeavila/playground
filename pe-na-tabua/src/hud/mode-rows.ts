import type { Careers } from '../domain/career/career'
import type { Difficulty } from '../domain/career/difficulty'

export interface ModeRow {
  id: string
  name: string
  blurb: string
  progress: string // "Level 3 of 5", "Champion", "New"
}

// Uma linha por modo, com quanto o jogador já andou na carreira dele.
export function modeRows(difficulties: Difficulty[], careers: Careers, levelCount: number): ModeRow[] {
  return difficulties.map(({ id, name, blurb }) => {
    const career = careers[id]
    const fresh = career.level === 1 && career.cleared.length === 0 && !career.champion
    const progress = career.champion ? 'Champion' : fresh ? 'New' : `Level ${career.level} of ${levelCount}`
    return { id, name, blurb, progress }
  })
}
