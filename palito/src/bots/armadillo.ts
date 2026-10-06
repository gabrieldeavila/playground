import type { AttackKind, Input } from '../sim/types'
import { StateBot, chance } from './base'
import type { Guard, Situation } from './base'

type State = 'walk' | 'burrow' | 'windup' | 'poke' | 'shell' | 'pounce' | 'pounceWindup'

// Agachado, o soco já passa por cima: a guarda dele é contra o chute (levanta e defende).
const GUARD: Guard[] = [
  { block: 0.25, counter: 0.4, reaction: 5, pressure: 0.3 },
  { block: 0.35, counter: 0.5, reaction: 4, pressure: 0.3 },
  { block: 0.45, counter: 0.6, reaction: 4, pressure: 0.25 },
]

// Tatu: perto de você, fica agachado o tempo todo (o soco passa por cima), cutuca de baixo
// e dá rasteira da meia distância.
// Quando leva golpe, levanta e se fecha na defesa um tempo. Ensina a atacar baixo, com chute.
export class Armadillo extends StateBot<State> {
  protected interruptible: State[] = ['burrow', 'windup', 'poke', 'pounceWindup', 'pounce']
  // Soco agachado de perto, rasteira (chute agachado) um pouco mais de longe.
  private next: AttackKind = 'punch'

  constructor(level: number) {
    super('walk', 'shell', level)
  }

  protected act(s: Situation, input: Input): void {
    switch (this.state) {
      case 'walk':
        // Agachado não dá para andar: ele anda em pé até chegar perto.
        if (this.guard(s, input, GUARD[this.level])) return
        if (this.keepRange(s, input, 0, 65)) this.go('burrow')
        break
      case 'burrow':
        input.crouch = true
        if (s.opp.attack?.kind === 'kick' && this.guard(s, input, GUARD[this.level])) return
        if (s.opp.attack?.kind === 'punch') this.guard(s, input, { ...GUARD[this.level], block: 0 })
        if (s.dist < 85 && this.ticks > 20 - this.level * 6 && this.canWindUp(s)) this.go('windup')
        // Você ficou chutando da ponta: às vezes ele sai da toca pulando com um chute.
        else if (s.dist > 80 && s.dist < 200 && this.ticks > 50 - this.level * 10 && chance(0.03)) this.go('pounceWindup')
        else if (s.dist > 85 && this.ticks > 40) this.go('walk')
        break
      case 'windup':
        input.crouch = true
        if (this.ticks === 1) this.next = s.dist < 65 ? 'punch' : 'kick'
        this.tell = this.next
        if (this.ticks >= 12 - this.level * 3) this.go('poke')
        break
      case 'poke':
        input.crouch = true
        if (this.strike(s, input, this.next)) this.go('burrow')
        break
      case 'shell':
        // Fecha a guarda em pé por um tempo depois de apanhar.
        input.block = true
        if (this.ticks > 35) this.go(s.dist > 110 ? 'walk' : 'burrow')
        break
      case 'pounceWindup':
        this.tell = 'jump'
        if (this.ticks >= 14) this.go('pounce')
        break
      case 'pounce':
        if (this.ticks === 1) {
          input.jump = true
          input[s.forward] = true
        } else if (!s.me.onGround && s.me.vy > -3 && s.dist < 110) {
          input.kick = true
        } else if (s.me.onGround && this.ticks > 3 && !s.me.attack) {
          this.go('burrow')
        }
        break
    }
  }
}
