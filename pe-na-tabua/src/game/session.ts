import { createRace } from '../domain/race/create-race'
import { POLICE, ROSTER } from '../domain/race/roster'
import { stepRace } from '../domain/race/step-race'
import type { Race, RaceEvent, RiderInput } from '../domain/race/types'
import type { Track } from '../domain/track/types'

export type Mode = 'title' | 'racing' | 'results'

const RESULTS_DELAY = 2.5

// Fluxo título -> corrida -> resultado. Sem DOM nem three.
export class Session {
  mode: Mode = 'title'
  race: Race
  private sinceFinish = 0
  private races = 0

  constructor(private readonly track: Track) {
    this.race = this.freshRace()
  }

  start(): void {
    this.race = this.freshRace()
    this.mode = 'racing'
    this.sinceFinish = 0
  }

  step(input: RiderInput, dt: number): RaceEvent[] {
    if (this.mode === 'title') return []
    const events = stepRace(this.race, input, dt)
    if (this.mode === 'racing' && (this.race.phase === 'finished' || this.race.phase === 'busted')) {
      this.sinceFinish += dt
      if (this.sinceFinish >= RESULTS_DELAY) this.mode = 'results'
    }
    return events
  }

  private freshRace(): Race {
    this.races += 1
    return createRace(this.track, [...ROSTER, ...POLICE], this.races * 7919)
  }
}
