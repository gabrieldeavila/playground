import type { AttackKind, Input } from '../sim/types'
import { StateBot, chance } from './base'
import type { Guard, Situation } from './base'

type State = 'approach' | 'hesitate' | 'windup' | 'attack' | 'retreat'

const GUARD: Guard[] = [
  { block: 0.1, counter: 0, reaction: 5, pressure: 0.1 },
  { block: 0.2, counter: 0.1, reaction: 4, pressure: 0.2 },
  { block: 0.3, counter: 0.2, reaction: 4, pressure: 0.3 },
]

// Novato: chega devagar, hesita, avisa bem antes de bater e quase não defende.
// Fase de aprender a andar, socar e chutar.
export class Rookie extends StateBot<State> {
  protected interruptible: State[] = ['windup', 'attack']
  private next: AttackKind = 'punch'

  constructor(level: number) {
    super('approach', 'retreat', level)
  }

  protected act(s: Situation, input: Input): void {
    if (this.state !== 'windup' && this.state !== 'attack' && this.guard(s, input, GUARD[this.level])) return

    switch (this.state) {
      case 'approach':
        if (this.keepRange(s, input, 0, 80)) this.go(chance(0.6) ? 'windup' : 'hesitate')
        else if (this.ticks > 50 && chance(0.02)) this.go('hesitate')
        break
      case 'hesitate':
        if (this.ticks > 45 - this.level * 10) this.go(s.dist > 80 ? 'approach' : 'windup')
        break
      case 'windup':
        if (this.ticks === 1) this.next = s.dist > 65 ? 'kick' : 'punch'
        this.tell = this.next
        if (this.ticks >= 30 - this.level * 6) this.go('attack')
        break
      case 'attack':
        if (this.strike(s, input, this.next)) this.go('retreat')
        break
      case 'retreat':
        if (!s.cornered) input[s.back] = true
        if (this.ticks > 30) this.go('approach')
        break
    }
  }
}
