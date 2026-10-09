import { lerp } from '../math'
import { DEFAULT_RULES, type RaceRules } from '../race/rules'

// O quanto uma corrida aperta, numa escala de intensidade: 0 = o mais fácil, 1 = o jogo
// como foi afinado (Outlaw nível 1), 5 = Outlaw nível 5. Entre dois pontos, interpola.
export interface Challenge {
  botPace: number // somado ao pace de cada bot (entre 0 e 1 no fim)
  botAggression: number // somado à agressividade de cada bot (entre 0 e 1 no fim)
  armedBots: number // os mais agressivos largam armados
  cops: number
  traffic: number // densidade do trânsito (1 = carros por km de hoje)
  copSpeedFactor: number
  copAttacksPerSecond: number
  bustTime: number
  carCrashDamage: number
}

const TODAY: Challenge = {
  botPace: 0,
  botAggression: 0,
  armedBots: 3,
  cops: 2,
  traffic: 1,
  copSpeedFactor: DEFAULT_RULES.copSpeedFactor,
  copAttacksPerSecond: DEFAULT_RULES.copAttacksPerSecond,
  bustTime: DEFAULT_RULES.bustTime,
  carCrashDamage: DEFAULT_RULES.carCrashDamage,
}

// Um ponto por intensidade inteira. Acima de 1, só os bots, a polícia e o trânsito crescem.
export const CHALLENGE_STEPS: Challenge[] = [
  // 0: policial mais lento que a moto do jogador (só alcança quem cai), quase não bate
  { botPace: -0.08, botAggression: -0.3, armedBots: 0.4, cops: 1, traffic: 0.6, copSpeedFactor: 0.97, copAttacksPerSecond: 0.15, bustTime: 2, carCrashDamage: 12 },
  TODAY,
  { ...TODAY, botPace: 0.01, botAggression: 0.05, armedBots: 4, traffic: 1.1 },
  { ...TODAY, botPace: 0.02, botAggression: 0.1, armedBots: 5, cops: 3, traffic: 1.2 },
  { ...TODAY, botPace: 0.03, botAggression: 0.15, armedBots: 6, cops: 3, traffic: 1.3 },
  { ...TODAY, botPace: 0.04, botAggression: 0.2, armedBots: 7, cops: 4, traffic: 1.4 },
]

// Onde os policiais esperam, por quantidade (fração do caminho até a chegada).
const COP_LAYOUTS: number[][] = [[], [0.5], [0.3, 0.65], [0.25, 0.5, 0.75], [0.2, 0.4, 0.6, 0.8]]

export function challengeAt(intensity: number): Challenge {
  const top = CHALLENGE_STEPS.length - 1
  const t = Math.min(Math.max(intensity, 0), top)
  const low = CHALLENGE_STEPS[Math.floor(t)]
  const high = CHALLENGE_STEPS[Math.ceil(t)]
  const mix = t - Math.floor(t)
  const challenge = { ...low }
  for (const key of Object.keys(low) as (keyof Challenge)[]) challenge[key] = lerp(low[key], high[key], mix)
  return { ...challenge, armedBots: Math.round(challenge.armedBots), cops: Math.round(challenge.cops) }
}

export function copLayout(cops: number): number[] {
  return COP_LAYOUTS[Math.min(cops, COP_LAYOUTS.length - 1)]
}

export function rulesFor(challenge: Challenge, base: Pick<RaceRules, 'canBust' | 'catchUp'>): RaceRules {
  const { copSpeedFactor, copAttacksPerSecond, bustTime, carCrashDamage } = challenge
  return { ...base, copSpeedFactor, copAttacksPerSecond, bustTime, carCrashDamage }
}
