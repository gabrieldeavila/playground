import type { Input } from '../sim/types'
import { StateBot, chance } from './base'
import type { Guard, Situation } from './base'

type State = 'space' | 'windup' | 'kick' | 'recover' | 'shove'

const GUARD: Guard[] = [
  { block: 0.4, counter: 0.4, reaction: 4, pressure: 0.35 },
  { block: 0.55, counter: 0.5, reaction: 4, pressure: 0.3 },
  { block: 0.7, counter: 0.6, reaction: 3, pressure: 0.25 },
]

// Chutador: fica na ponta do alcance e chuta baixo. Se você chega muito perto,
// empurra com um soco rápido e volta pra distância. Ensina a pular o chute e entrar
// enquanto ele recolhe a perna.
export class Kicker extends StateBot<State> {
  protected interruptible: State[] = ['windup', 'kick', 'shove']

  constructor(level: number) {
    super('space', 'space', level)
  }

  protected act(s: Situation, input: Input): void {
    switch (this.state) {
      case 'space':
        if (this.guard(s, input, GUARD[this.level])) return
        if (s.dist < 60 && chance(0.25 + 0.15 * this.level)) {
          this.go('shove')
          return
        }
        const inRange = this.keepRange(s, input, 85, 100)
        if (inRange && this.canWindUp(s) && this.ticks > 25 - this.level * 8 && chance(0.08)) this.go('windup')
        break
      case 'windup':
        this.tell = 'kick'
        if (this.ticks >= 16 - this.level * 3) this.go('kick')
        break
      case 'kick':
        if (this.strike(s, input, 'kick')) this.go('recover')
        break
      case 'recover':
        if (this.ticks > 14 - this.level * 4) this.go('space')
        break
      case 'shove':
        if (this.strike(s, input, 'punch')) this.go('space')
        break
    }
  }
}
