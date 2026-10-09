import type { Difficulty } from '../domain/career/difficulty'
import { LEVELS, type Level } from '../domain/career/levels'
import { type RaceSetup, buildRaceSetup } from '../domain/career/race-setup'
import { COURSES } from '../domain/track/courses/courses'
import { createTrack } from '../domain/track/create-track'
import type { Course, Track } from '../domain/track/types'

export interface PreparedRace {
  difficulty: Difficulty
  level: Level
  course: Course // a original, sem esticar: o nome identifica a pista na carreira
  setup: RaceSetup
  track: Track
}

// Monta grid e regras de cada modo e nível uma vez só. A pista depende só do nível: os
// modos dividem o mesmo objeto, e o cenário 3D só é refeito quando ela muda.
export class RaceCatalog {
  private readonly races = new Map<string, PreparedRace>()
  private readonly tracks = new Map<string, Track>()

  get(difficulty: Difficulty, levelNumber: number, courseName: string): PreparedRace {
    const key = `${difficulty.id}:${levelNumber}:${courseName}`
    let prepared = this.races.get(key)
    if (!prepared) {
      prepared = this.prepare(difficulty, LEVELS[levelNumber - 1], courseNamed(courseName))
      this.races.set(key, prepared)
    }
    return prepared
  }

  private prepare(difficulty: Difficulty, level: Level, course: Course): PreparedRace {
    const setup = buildRaceSetup(course, level, difficulty)
    const key = `${level.number}:${course.name}`
    let track = this.tracks.get(key)
    if (!track) {
      track = createTrack(setup.course)
      this.tracks.set(key, track)
    }
    return { difficulty, level, course, setup, track }
  }
}

function courseNamed(name: string): Course {
  const course = COURSES.find((c) => c.name === name)
  if (!course) throw new Error(`Pista desconhecida: ${name}`)
  return course
}
