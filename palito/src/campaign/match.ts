import type { Controller } from '../bots/controller'
import { MAX_HP } from '../sim/constants'
import { EMPTY_INPUT } from '../sim/types'
import type { World } from '../sim/types'
import { createWorld, step } from '../sim/world'
import type { Stage } from './stages'

const ROUNDS_TO_WIN = 2
// Empate não conta ponto para ninguém; depois disso, quem tiver mais rounds leva (empate = derrota).
const MAX_ROUNDS = 5
const INTRO_TICKS = 70
const GO_TICKS = 35
const AFTER_ROUND_TICKS = 150
// 3ª estrela: vencer todos os rounds com pelo menos essa vida.
const SAFE_HP = MAX_HP * 0.7

export interface MatchResult {
  won: boolean
  // Cada estrela: vencer, não perder nenhum round, vencer todos os rounds com 70%+ de vida.
  noRoundLost: boolean
  healthy: boolean
  stars: number
}

// Uma luta de campanha: melhor de 3 rounds contra o bot da fase, que fica mais esperto a cada round.
// O jogador é sempre o lutador 0.
export class Match {
  world!: World
  bot!: Controller
  phase: 'intro' | 'fight' | 'after' | 'done' = 'intro'
  round = 0
  wins: [number, number] = [0, 0]
  result: MatchResult | null = null
  onRoundStart: () => void = () => {}
  private timer = 0
  private roundsLost = 0
  private lowestWinningHp = MAX_HP

  constructor(
    readonly stage: Stage,
    private readonly player: Controller,
  ) {
    this.startRound()
  }

  private startRound(): void {
    this.world = createWorld()
    this.bot = this.stage.createBot(Math.min(this.round, 2))
    this.phase = 'intro'
    this.timer = 0
    this.onRoundStart()
  }

  // Avança um tick. Devolve true se a simulação andou.
  update(): boolean {
    this.timer++
    switch (this.phase) {
      case 'intro':
        if (this.timer >= INTRO_TICKS) {
          this.phase = 'fight'
          this.timer = 0
        }
        return false
      case 'fight':
        step(this.world, [this.player.read(this.world, 0), this.bot.read(this.world, 1)])
        if (this.world.phase === 'over') this.endRound()
        return true
      case 'after':
        step(this.world, [EMPTY_INPUT, EMPTY_INPUT])
        if (this.timer >= AFTER_ROUND_TICKS) this.nextRound()
        return true
      case 'done':
        step(this.world, [EMPTY_INPUT, EMPTY_INPUT])
        return true
    }
  }

  get banner(): string | null {
    if (this.phase === 'intro') return this.wins[0] === 1 && this.wins[1] === 1 ? 'ROUND FINAL' : `ROUND ${this.round + 1}`
    if (this.phase === 'fight' && this.timer < GO_TICKS) return 'LUTE!'
    return null
  }

  private endRound(): void {
    const winner = this.world.winner
    if (winner === 0) {
      this.wins[0]++
      this.lowestWinningHp = Math.min(this.lowestWinningHp, this.world.fighters[0].hp)
    } else if (winner === 1) {
      this.wins[1]++
      this.roundsLost++
    }
    this.phase = 'after'
    this.timer = 0
  }

  private nextRound(): void {
    const decided = this.wins.some((w) => w >= ROUNDS_TO_WIN) || this.round + 1 >= MAX_ROUNDS
    if (!decided) {
      this.round++
      this.startRound()
      return
    }
    const won = this.wins[0] > this.wins[1]
    const noRoundLost = won && this.roundsLost === 0
    const healthy = won && this.lowestWinningHp >= SAFE_HP
    this.result = { won, noRoundLost, healthy, stars: won ? 1 + Number(noRoundLost) + Number(healthy) : 0 }
    this.phase = 'done'
  }
}
