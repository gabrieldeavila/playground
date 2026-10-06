import type { Input } from '../sim/types'
import { StateBot, chance } from './base'
import type { Guard, Situation } from './base'

type State = 'bounce' | 'feint' | 'windup' | 'leap' | 'land'

const GUARD: Guard[] = [
  { block: 0.3, counter: 0.3, reaction: 4, pressure: 0.35 },
  { block: 0.45, counter: 0.4, reaction: 4, pressure: 0.3 },
  { block: 0.6, counter: 0.5, reaction: 3, pressure: 0.25 },
]

// Pulador: fica quicando de longe e entra pelo alto com chute. No ar não consegue
// defender e, ao cair, fica um tempo parado. Ensina a socar quem vem pulando (anti-aéreo)
// ou defender e punir na queda.
export class Jumper extends StateBot<State> {
  protected interruptible: State[] = ['windup']

  constructor(level: number) {
    super('bounce', 'bounce', level)
  }

  protected act(s: Situation, input: Input): void {
    switch (this.state) {
      case 'bounce':
        if (s.me.onGround && this.guard(s, input, GUARD[this.level])) return
        // Distância certa para o pulo terminar com o chute em cima de você.
        if (!this.keepRange(s, input, 190, 215)) break
        if (this.ticks > 40 - this.level * 10 && chance(0.06)) {
          // A partir do 2º round, às vezes pula parado só para ver você reagir.
          this.go(this.level > 0 && chance(0.35) ? 'feint' : 'windup')
        }
        break
      case 'feint':
        if (this.ticks === 1) input.jump = true
        else if (s.me.onGround && this.ticks > 3) this.go('bounce')
        break
      case 'windup':
        this.tell = 'jump'
        if (this.ticks >= 16 - this.level * 4) this.go('leap')
        break
      case 'leap':
        if (this.ticks === 1) {
          input.jump = true
          input[s.forward] = true
        } else if (!s.me.onGround) {
          // Chuta já caindo, para o golpe sair na altura do corpo.
          if (s.me.vy >= 3 && s.dist < 150) input.kick = true
        } else if (this.ticks > 3 && !s.me.attack) {
          this.go('land')
        }
        break
      case 'land':
        this.tell = 'tired'
        if (this.ticks > 26 - this.level * 6) this.go('bounce')
        break
    }
  }
}
