import { ATTACKS } from '../sim/attacks'
import { ARENA_WIDTH, WALL_MARGIN } from '../sim/constants'
import { EMPTY_INPUT } from '../sim/types'
import type { Attack, AttackKind, Fighter, Input, PlayerIndex, World } from '../sim/types'
import type { Controller, Tell } from './controller'

export interface Situation {
  me: Fighter
  opp: Fighter
  dist: number
  forward: 'left' | 'right'
  back: 'left' | 'right'
  // Em que parte do golpe o oponente está (null = não está atacando).
  oppPhase: 'startup' | 'active' | 'recovery' | null
  // Encostado na parede de trás.
  cornered: boolean
}

function situation(world: World, index: PlayerIndex): Situation {
  const me = world.fighters[index]
  const opp = world.fighters[1 - index]
  const forward = opp.x >= me.x ? 'right' : 'left'
  const wallBehind = forward === 'right' ? me.x - WALL_MARGIN : ARENA_WIDTH - WALL_MARGIN - me.x
  return {
    me,
    opp,
    dist: Math.abs(opp.x - me.x),
    forward,
    back: forward === 'right' ? 'left' : 'right',
    oppPhase: attackPhase(opp.attack),
    cornered: wallBehind < 40,
  }
}

function attackPhase(a: Attack | null): Situation['oppPhase'] {
  if (!a) return null
  const s = ATTACKS[a.kind]
  if (a.tick < s.startup) return 'startup'
  if (a.tick < s.startup + s.active) return 'active'
  return 'recovery'
}

// Quanto o bot se protege quando não está atacando nem vulnerável.
export interface Guard {
  // Chance de defender cada golpe do oponente.
  block: number
  // Chance de revidar com soco quando o golpe do oponente termina perto dele.
  counter: number
  // Ticks do começo do golpe do oponente até reagir.
  reaction: number
  // Chance extra de defender logo depois de apanhar: o bot fecha a guarda sob pressão.
  pressure: number
}

export function chance(p: number): boolean {
  return Math.random() < p
}

// Bot de máquina de estados: está sempre num estado com nome (avançar, avisar, atacar,
// cansar...) e sabe há quantos ticks está nele. Cada ataque tem um aviso antes e uma janela
// de punição depois, sempre do mesmo jeito: é isso que deixa o bot legível e justo.
//
// level sobe a cada round (0, 1, 2): avisos mais curtos, reação mais rápida, menos descanso.
export abstract class StateBot<S extends string> implements Controller {
  tell: Tell = null
  protected ticks = 0
  // Estados que um golpe recebido interrompe (o bot volta para o neutro).
  protected abstract interruptible: S[]
  private seenAttack: Attack | null = null
  private willBlock = false
  private willCounter = false
  // Ticks desde o último golpe recebido.
  private sinceHurt = Infinity

  constructor(
    protected state: S,
    private readonly neutral: S,
    protected readonly level: number,
  ) {}

  read(world: World, index: PlayerIndex): Input {
    const input = { ...EMPTY_INPUT }
    if (world.phase !== 'fight') {
      this.tell = null
      return input
    }
    const s = situation(world, index)
    this.ticks++
    this.sinceHurt = s.me.hitStun > 0 ? 0 : this.sinceHurt + 1
    if (s.me.hitStun > 0 && this.interruptible.includes(this.state)) this.go(this.neutral)
    this.act(s, input)
    return input
  }

  protected abstract act(s: Situation, input: Input): void

  protected go(state: S): void {
    this.state = state
    this.ticks = 0
    this.tell = null
  }

  // Guarda do bot fora das janelas de punição. Decide uma vez por golpe do oponente se vai
  // defender e se vai revidar quando o golpe dele terminar. Devolve true enquanto está reagindo.
  protected guard(s: Situation, input: Input, g: Guard): boolean {
    const attack = s.opp.attack
    if (attack !== this.seenAttack) {
      this.seenAttack = attack
      this.willBlock = attack !== null && chance(this.pressured(s) ? g.block + g.pressure : g.block)
      this.willCounter = attack !== null && chance(g.counter)
    }
    if (!attack) return false
    if (s.oppPhase === 'recovery') {
      // Revida com soco de perto e com chute (mais lento, mais longo) da ponta.
      if (!this.willCounter || s.dist > 100 || s.me.attack || s.me.blockStun > 0) return false
      if (s.dist <= 75) input.punch = true
      else input.kick = true
      return true
    }
    if (!this.willBlock || attack.tick < g.reaction || s.dist > ATTACKS[attack.kind].reach + 50) return false
    input.block = true
    input.crouch = false
    return true
  }

  // Apanhou há pouco e o oponente continua em cima: não é hora de começar ataque com aviso.
  protected pressured(s: Situation): boolean {
    return this.sinceHurt < 40 && s.dist < 110
  }

  // Pode começar um ataque com aviso: o oponente não está batendo e não está sob pressão.
  protected canWindUp(s: Situation): boolean {
    return !s.opp.attack && !this.pressured(s)
  }

  // Aperta o golpe e devolve true quando ele terminou (ou não saiu, por estar atordoado).
  protected strike(s: Situation, input: Input, kind: AttackKind): boolean {
    if (this.ticks === 1) {
      input[kind] = true
      return false
    }
    return !s.me.attack
  }

  // Mantém a distância entre min e max. Devolve true quando já está nela.
  protected keepRange(s: Situation, input: Input, min: number, max: number): boolean {
    if (s.dist > max) input[s.forward] = true
    else if (s.dist < min && !s.cornered) input[s.back] = true
    else return true
    return false
  }
}
