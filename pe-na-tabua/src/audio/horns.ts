import type { Race } from '../domain/race/types'
import { wantsToHonk } from '../domain/traffic/honk'
import type { Car } from '../domain/traffic/types'

// Cada carro buzina uma vez por encontro com o jogador.
export class Horns {
  private readonly honked = new Set<number>()

  reset(): void {
    this.honked.clear()
  }

  take(race: Race): Car[] {
    const player = race.riders[race.playerId]
    const honking: Car[] = []
    for (const car of race.cars) {
      if (car.s < player.s) this.honked.delete(car.id)
      if (this.honked.has(car.id) || !wantsToHonk(car, player)) continue
      this.honked.add(car.id)
      honking.push(car)
    }
    return honking
  }
}
