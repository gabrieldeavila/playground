import type { Difficulty } from '../src/domain/career/difficulty'
import type { Level } from '../src/domain/career/levels'
import { buildRaceSetup } from '../src/domain/career/race-setup'
import { createTrack } from '../src/domain/track/create-track'
import type { Course } from '../src/domain/track/types'
import type { PlayerModel } from './player-models'
import { runRace } from './run-race'
import { type Summary, summarize } from './summarize'

// Roda `races` corridas de um modelo de jogador num nível de um modo.
export function simulate(course: Course, level: Level, difficulty: Difficulty, model: PlayerModel, races: number, cops = true): Summary {
  const full = buildRaceSetup(course, level, difficulty)
  const setup = cops ? full : { ...full, riders: full.riders.filter((r) => r.role !== 'cop') }
  const track = trackFor(setup.course)
  const outcomes = Array.from({ length: races }, (_, i) => runRace(track, setup, model, i + 1))
  return summarize(outcomes, difficulty.qualifyPlace)
}

const tracks = new Map<string, ReturnType<typeof createTrack>>()

function trackFor(course: Course) {
  const key = `${course.name}:${course.seed}:${course.body.length}`
  if (!tracks.has(key)) tracks.set(key, createTrack(course))
  return tracks.get(key)!
}
