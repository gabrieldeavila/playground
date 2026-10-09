import type { Outcome } from './run-race'

export interface Summary {
  races: number
  qualify: number // fração de 0 a 1
  win: number
  busted: number
  meanPlace: number // só de quem não foi preso
  carCrashes: number // por corrida
  knockouts: number
  meanTime: number // s, só de quem não foi preso
  places: number[] // places[p - 1] = quantas vezes chegou em p
  bustCauses: Map<string, number>
}

export function summarize(outcomes: Outcome[], qualifyPlace: number): Summary {
  const finished = outcomes.filter((o) => o.place !== null)
  const share = (test: (o: Outcome) => boolean) => outcomes.filter(test).length / outcomes.length
  return {
    races: outcomes.length,
    qualify: share((o) => o.place !== null && o.place <= qualifyPlace),
    win: share((o) => o.place === 1),
    busted: share((o) => o.place === null),
    meanPlace: mean(finished.map((o) => o.place!)),
    carCrashes: mean(outcomes.map((o) => o.carCrashes)),
    knockouts: mean(outcomes.map((o) => o.knockouts)),
    meanTime: mean(finished.map((o) => o.time)),
    places: countPlaces(finished),
    bustCauses: countBustCauses(outcomes),
  }
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length
}

function countPlaces(finished: Outcome[]): number[] {
  const last = Math.max(0, ...finished.map((o) => o.place!))
  return Array.from({ length: last }, (_, i) => finished.filter((o) => o.place === i + 1).length)
}

function countBustCauses(outcomes: Outcome[]): Map<string, number> {
  const causes = new Map<string, number>()
  for (const { bustCause } of outcomes) if (bustCause) causes.set(bustCause, (causes.get(bustCause) ?? 0) + 1)
  return causes
}
