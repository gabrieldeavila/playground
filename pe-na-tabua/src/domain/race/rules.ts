import { BUST_TIME, COP_ATTACKS_PER_SECOND, COP_SPEED_FACTOR } from '../police/constants'
import { CAR_CRASH_DAMAGE } from '../traffic/constants'

// Regras que mudam com a dificuldade e são lidas durante a corrida.
export interface RaceRules {
  copSpeedFactor: number // velocidade máxima do policial em relação à moto do jogador
  copAttacksPerSecond: number // vontade de bater com o cassetete, colado no jogador
  bustTime: number // s com o policial em cima do jogador caído até ser preso
  canBust: boolean // false = polícia persegue e bate, mas nunca prende
  carCrashDamage: number
  catchUp: number // velocidade máxima extra do jogador quando fica muito para trás (fração)
}

// O jogo como ele foi afinado (Outlaw).
export const DEFAULT_RULES: RaceRules = {
  copSpeedFactor: COP_SPEED_FACTOR,
  copAttacksPerSecond: COP_ATTACKS_PER_SECOND,
  bustTime: BUST_TIME,
  canBust: true,
  carCrashDamage: CAR_CRASH_DAMAGE,
  catchUp: 0,
}
