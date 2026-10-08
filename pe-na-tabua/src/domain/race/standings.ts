import type { Race, Rider } from './types'

// Quem já chegou vem primeiro (por tempo); o resto por distância percorrida.
export function standings(race: Race): Rider[] {
  return [...race.riders].sort(compareRiders)
}

export function placeOf(race: Race, riderId: number): number {
  return standings(race).findIndex((r) => r.id === riderId) + 1
}

function compareRiders(a: Rider, b: Rider): number {
  if (a.finishTime !== null && b.finishTime !== null) return a.finishTime - b.finishTime
  if (a.finishTime !== null) return -1
  if (b.finishTime !== null) return 1
  return b.s - a.s
}
