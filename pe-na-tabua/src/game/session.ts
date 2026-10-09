import { type Career, type Careers, type Verdict, courseAfter, courseToRace, recordResult } from '../domain/career/career'
import { DIFFICULTIES, type Difficulty, difficultyById } from '../domain/career/difficulty'
import { clamp } from '../domain/math'
import { createRace } from '../domain/race/create-race'
import { placeOf } from '../domain/race/standings'
import { stepRace } from '../domain/race/step-race'
import type { Race, RaceEvent, RiderInput } from '../domain/race/types'
import { COURSES } from '../domain/track/courses/courses'
import type { SaveData } from '../data/parse-save'
import { type PreparedRace, RaceCatalog } from './race-catalog'

export type Mode = 'title' | 'modes' | 'levels' | 'courses' | 'racing' | 'results'

const RESULTS_DELAY = 2.5
const COURSE_NAMES = COURSES.map((course) => course.name)

// Fluxo título -> modo -> nível -> pista -> corrida -> resultado, e as carreiras. Sem DOM nem three.
export class Session {
  mode: Mode = 'title'
  race: Race
  current: PreparedRace
  difficulty: Difficulty
  careers: Careers
  selected: number // nível escolhido na tela de níveis
  course: string // pista escolhida na tela de pistas
  verdict: Verdict | null = null // resultado da última corrida, para a tela de resultado
  private sinceFinish = 0
  private races = 0

  constructor(
    save: SaveData,
    private readonly catalog = new RaceCatalog(),
  ) {
    this.difficulty = difficultyById(save.difficulty)
    this.careers = save.careers
    this.selected = this.career.level
    this.course = courseToRace(this.career, this.selected, COURSE_NAMES)
    this.current = this.prepare()
    this.race = this.freshRace()
  }

  get career(): Career {
    return this.careers[this.difficulty.id]
  }

  get save(): SaveData {
    return { difficulty: this.difficulty.id, careers: this.careers }
  }

  showTitle(): void {
    this.mode = 'title'
  }

  openModes(): void {
    this.mode = 'modes'
  }

  // Modos: anda entre os modos. Níveis: só entre os liberados. Pistas: entre as pistas.
  select(delta: number): void {
    if (this.mode === 'modes') this.pickMode(delta)
    else if (this.mode === 'courses') this.pickCourse(delta)
    else this.selected = clamp(this.selected + delta, 1, this.career.level)
  }

  openLevels(): void {
    this.mode = 'levels'
    this.selected = clamp(this.selected, 1, this.career.level)
  }

  // Abre já na pista que falta passar nesse nível.
  openCourses(): void {
    this.mode = 'courses'
    this.course = courseToRace(this.career, this.selected, COURSE_NAMES)
  }

  start(): void {
    this.current = this.prepare()
    this.race = this.freshRace()
    this.mode = 'racing'
    this.sinceFinish = 0
    this.verdict = null
  }

  step(input: RiderInput, dt: number): RaceEvent[] {
    if (this.mode !== 'racing' && this.mode !== 'results') return []
    const events = stepRace(this.race, input, dt)
    if (this.mode === 'racing' && (this.race.phase === 'finished' || this.race.phase === 'busted')) {
      this.sinceFinish += dt
      if (this.sinceFinish >= RESULTS_DELAY) this.finish()
    }
    return events
  }

  private pickCourse(delta: number): void {
    const index = clamp(COURSE_NAMES.indexOf(this.course) + delta, 0, COURSE_NAMES.length - 1)
    this.course = COURSE_NAMES[index]
  }

  private pickMode(delta: number): void {
    const index = clamp(DIFFICULTIES.indexOf(this.difficulty) + delta, 0, DIFFICULTIES.length - 1)
    this.difficulty = DIFFICULTIES[index]
    this.selected = this.career.level
  }

  // Conta o resultado na carreira do modo e já escolhe a próxima corrida: o nível liberado,
  // a pista que falta, ou a mesma de novo.
  private finish(): void {
    this.mode = 'results'
    const { difficulty, level, course } = this.current
    const place = this.race.phase === 'busted' ? null : placeOf(this.race, this.race.playerId)
    const { career, verdict } = recordResult(this.careers[difficulty.id], { level: level.number, course: course.name, place }, COURSE_NAMES, difficulty)
    this.careers = { ...this.careers, [difficulty.id]: career }
    this.verdict = verdict
    if (verdict.unlocked) this.selected = verdict.unlocked
    this.course = courseAfter(career, this.selected, course.name, verdict.qualified, COURSE_NAMES)
  }

  private prepare(): PreparedRace {
    return this.catalog.get(this.difficulty, this.selected, this.course)
  }

  private freshRace(): Race {
    this.races += 1
    const { track, setup } = this.current
    return createRace(track, setup.riders, this.races * 7919, { trafficScale: setup.trafficScale, rules: setup.rules })
  }
}
