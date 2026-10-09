import { type Career, type Careers, NEW_CAREER, NEW_CAREERS } from '../domain/career/career'
import { DIFFICULTIES, type DifficultyId } from '../domain/career/difficulty'

// O que fica salvo: uma carreira por modo e o último modo jogado.
export interface SaveData {
  difficulty: DifficultyId
  careers: Careers
}

export const NEW_SAVE: SaveData = { difficulty: 'racer', careers: NEW_CAREERS }

// Lê o que foi salvo. Qualquer coisa estranha volta para o começo, por partes: uma carreira
// quebrada não apaga as outras.
export function parseSave(text: string | null, levelCount: number): SaveData {
  const raw = parseJson(text)
  if (typeof raw !== 'object' || raw === null) return NEW_SAVE
  const { difficulty, careers } = raw as Record<string, unknown>
  const saved = (typeof careers === 'object' && careers !== null ? careers : {}) as Record<string, unknown>
  return {
    difficulty: isDifficulty(difficulty) ? difficulty : NEW_SAVE.difficulty,
    careers: Object.fromEntries(DIFFICULTIES.map(({ id }) => [id, careerOrNew(saved[id], levelCount)])) as Careers,
  }
}

function parseJson(text: string | null): unknown {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function isDifficulty(value: unknown): value is DifficultyId {
  return DIFFICULTIES.some((d) => d.id === value)
}

function careerOrNew(raw: unknown, levelCount: number): Career {
  if (typeof raw !== 'object' || raw === null) return NEW_CAREER
  const { level, cleared, champion } = raw as Record<string, unknown>
  const valid =
    Number.isInteger(level) &&
    (level as number) >= 1 &&
    (level as number) <= levelCount &&
    Array.isArray(cleared) &&
    cleared.every((course) => typeof course === 'string') &&
    typeof champion === 'boolean'
  return valid ? { level: level as number, cleared: [...(cleared as string[])], champion: champion as boolean } : NEW_CAREER
}
