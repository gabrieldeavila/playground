import type { Attack, Input } from '../sim/types'
import { StateBot } from './base'
import type { Guard, Situation } from './base'

type State = 'advance' | 'windup' | 'flurry' | 'tired'

const GUARD: Guard[] = [
  { block: 0.5, counter: 0.4, reaction: 4, pressure: 0.35 },
  { block: 0.6, counter: 0.5, reaction: 3, pressure: 0.3 },
  { block: 0.7, counter: 0.6, reaction: 3, pressure: 0.25 },
]

// Brigão: vem pra cima, puxa o braço e solta uma rajada de socos. Depois da rajada
// fica cansado e parado. Ensina a defender a rajada e bater na hora que ele cansa.
export class Brawler extends StateBot<State> {
  // Cansado continua cansado mesmo apanhando: é a janela de punição.
  protected interruptible: State[] = ['windup', 'flurry']
  private punches = 0
  private current: Attack | null = null

  constructor(level: number) {
    super('advance', 'advance', level)
  }

  protected act(s: Situation, input: Input): void {
    switch (this.state) {
      case 'advance':
        if (this.guard(s, input, GUARD[this.level])) return
        if (this.keepRange(s, input, 0, 65) && this.canWindUp(s)) this.go('windup')
        break
      case 'windup':
        this.tell = 'punch'
        if (this.ticks >= 24 - this.level * 5) {
          this.punches = 0
          this.current = null
          this.go('flurry')
        }
        break
      case 'flurry':
        if (s.me.attack && s.me.attack !== this.current) {
          this.current = s.me.attack
          this.punches++
        }
        if (this.punches >= 3 + this.level) {
          if (!s.me.attack) this.go('tired')
        } else if (s.dist <= 75) {
          // Segura o soco: cada golpe que termina já emenda no próximo.
          input.punch = true
        } else if (!s.me.attack) {
          // Você foi empurrado para longe: ele vai atrás sem parar a rajada.
          input[s.forward] = true
          if (this.ticks > 120) this.go('tired')
        }
        break
      case 'tired':
        this.tell = 'tired'
        if (this.ticks > 75 - this.level * 15) this.go('advance')
        break
    }
  }
}
