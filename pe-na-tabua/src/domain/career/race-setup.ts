import { policeAt, ROSTER, type RiderSetup } from '../race/roster'
import type { RaceRules } from '../race/rules'
import { courseSections, sectionsLength } from '../track/course-sections'
import { stretchCourse } from '../track/stretch-course'
import type { Course } from '../track/types'
import { challengeAt, copLayout, rulesFor } from './challenge'
import type { Difficulty } from './difficulty'
import { levelRoster } from './level-roster'
import type { Level } from './levels'

// Cada nível muda a semente da pista: árvores e placas em outros lugares.
const LEVEL_SEED_STEP = 101

// Tudo que uma corrida precisa saber sobre a pista, quem está nela e as regras.
export interface RaceSetup {
  course: Course
  riders: RiderSetup[] // corredores na ordem do grid, depois os policiais
  trafficScale: number // multiplica os carros de cada faixa
  rules: RaceRules
}

export function buildRaceSetup(course: Course, level: Level, difficulty: Difficulty): RaceSetup {
  const challenge = challengeAt(difficulty.intensity[level.number - 1])
  const stretched = { ...stretchCourse(course, level.lengthScale), seed: course.seed + (level.number - 1) * LEVEL_SEED_STEP }
  return {
    course: stretched,
    riders: [...levelRoster(ROSTER, challenge), ...policeAt(copLayout(challenge.cops))],
    trafficScale: challenge.traffic * lengthRatio(stretched, course),
    rules: rulesFor(challenge, difficulty.rules),
  }
}

// Pista mais longa leva mais carros, para a densidade ficar a mesma.
function lengthRatio(course: Course, original: Course): number {
  return sectionsLength(courseSections(course)) / sectionsLength(courseSections(original))
}
