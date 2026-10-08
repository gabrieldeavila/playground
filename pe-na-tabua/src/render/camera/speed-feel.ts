import { clamp } from '../../domain/math'
import { ACCEL, BRAKE, MAX_SPEED } from '../../domain/race/constants'
import { gearFor } from '../../domain/race/gearbox'

const SURGE_RESPONSE = 5 // quão rápido o corpo reage à aceleração (1/s)
const KICK_DECAY = 6
const SURGE_FOV = 6 // graus a mais arrancando forte
const KICK_FOV = 4 // graus a mais logo depois de subir marcha
const HEAD_TILT = 0.035 // rad
const SHAKE = 0.0045 // rad de trepidação a toda velocidade

// O que o corpo do piloto sente da moto: velocidade, arrancada/freada e trocas de marcha.
export interface SpeedFeel {
  speed: number
  surge: number // -1 freando forte .. 1 acelerando forte (suavizado)
  gear: number
  kick: number // 1 logo depois de subir marcha, decai até 0
}

export interface HeadAngles {
  pitch: number
  yaw: number
  roll: number
}

export function createSpeedFeel(): SpeedFeel {
  return { speed: 0, surge: 0, gear: 1, kick: 0 }
}

export function stepSpeedFeel(feel: SpeedFeel, speed: number, dt: number): void {
  if (dt <= 0) return
  const accel = (speed - feel.speed) / dt
  const target = clamp(accel >= 0 ? accel / ACCEL : accel / BRAKE, -1, 1)
  feel.surge += (target - feel.surge) * (1 - Math.exp(-SURGE_RESPONSE * dt))
  const gear = gearFor(speed)
  feel.kick = gear > feel.gear ? 1 : feel.kick * Math.exp(-KICK_DECAY * dt)
  feel.gear = gear
  feel.speed = speed
}

export function speedRatio(feel: SpeedFeel): number {
  return clamp(feel.speed / MAX_SPEED, 0, 1)
}

// FOV abre com a velocidade e dá um tranco na arrancada e na troca de marcha.
export function feelFov(feel: SpeedFeel, base: number, range: number): number {
  return base + range * speedRatio(feel) ** 1.4 + SURGE_FOV * Math.max(0, feel.surge) + KICK_FOV * feel.kick
}

// Cabeça joga para trás acelerando e mergulha freando, mais a trepidação do motor e da pista.
// Girar a câmera é bem mais perceptível que sacudir a posição.
export function headAngles(feel: SpeedFeel, time: number): HeadAngles {
  const shake = SHAKE * speedRatio(feel) ** 2
  return {
    pitch: feel.surge * HEAD_TILT - feel.kick * 0.012 + shake * (Math.sin(time * 53) * 0.6 + Math.sin(time * 17.3) * 0.4),
    yaw: shake * (Math.sin(time * 41.7) * 0.5 + Math.sin(time * 11.1) * 0.5),
    roll: shake * Math.sin(time * 29.3) * 0.8,
  }
}

// Desfoque radial nas bordas da tela: só aparece da metade da velocidade para cima.
export function blurAmount(feel: SpeedFeel): number {
  const fast = clamp((speedRatio(feel) - 0.5) / 0.5, 0, 1)
  return fast ** 2 * (1 + 0.3 * feel.kick)
}
