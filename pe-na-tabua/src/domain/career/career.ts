import type { Difficulty, DifficultyId } from './difficulty'
import { LEVELS } from './levels'

// Progresso do jogador num modo. Passar em todas as pistas de um nível libera o próximo.
export interface Career {
  level: number // maior nível liberado
  cleared: string[] // pistas já passadas nesse nível (nome do Course)
  champion: boolean // passou do último nível
}

export const NEW_CAREER: Career = { level: 1, cleared: [], champion: false }

// Cada modo tem a sua carreira: trocar de modo não pula nível nenhum.
export type Careers = Record<DifficultyId, Career>

export const NEW_CAREERS: Careers = { joyride: NEW_CAREER, racer: NEW_CAREER, outlaw: NEW_CAREER }

export interface RaceResult {
  level: number
  course: string
  place: number | null // null = preso
}

// O que a tela de resultado conta para o jogador.
export interface Verdict {
  level: number
  qualifyPlace: number
  qualified: boolean
  unlocked: number | null // nível recém-liberado
  champion: boolean // acabou de passar do último nível
  coursesLeft: number | null // pistas que ainda faltam no nível (null = corrida não contou)
}

export function qualifies(place: number | null, qualifyPlace: number): boolean {
  return place !== null && place <= qualifyPlace
}

// Só correr no nível mais alto liberado faz a carreira andar; os anteriores são treino.
export function recordResult(
  career: Career,
  result: RaceResult,
  courses: string[],
  difficulty: Difficulty,
  levelCount = LEVELS.length,
): { career: Career; verdict: Verdict } {
  const { qualifyPlace } = difficulty
  const qualified = qualifies(result.place, qualifyPlace)
  const verdict: Verdict = { level: result.level, qualifyPlace, qualified, unlocked: null, champion: false, coursesLeft: null }
  if (!qualified || result.level !== career.level || career.champion) return { career, verdict }
  const cleared = career.cleared.includes(result.course) ? career.cleared : [...career.cleared, result.course]
  const coursesLeft = courses.filter((course) => !cleared.includes(course)).length
  if (coursesLeft > 0) return { career: { ...career, cleared }, verdict: { ...verdict, coursesLeft } }
  if (career.level === levelCount) return { career: { ...career, cleared, champion: true }, verdict: { ...verdict, champion: true, coursesLeft } }
  const next = career.level + 1
  return { career: { level: next, cleared: [], champion: false }, verdict: { ...verdict, unlocked: next, coursesLeft } }
}

// Depois da corrida: quem não passou repete a pista; quem passou vai para a próxima que falta
// no nível (no treino ou depois de campeão, a próxima da lista).
export function courseAfter(career: Career, level: number, course: string, qualified: boolean, courses: string[]): string {
  if (!qualified) return course
  if (level === career.level && !career.champion) return courseToRace(career, level, courses)
  return courses[(courses.indexOf(course) + 1) % courses.length]
}

// Próxima pista do nível: no nível atual, a primeira que falta passar; nos outros, a primeira.
export function courseToRace(career: Career, level: number, courses: string[]): string {
  if (level !== career.level) return courses[0]
  return courses.find((course) => !career.cleared.includes(course)) ?? courses[0]
}
