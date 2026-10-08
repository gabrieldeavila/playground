import { MAX_SPEED } from './constants'

// Velocidade máxima de cada marcha, como fração da máxima da moto.
const GEAR_TOPS = [0.2, 0.36, 0.52, 0.68, 0.84, 1]

export const GEARS = GEAR_TOPS.length
export const IDLE_RPM = 1200
export const SHIFT_RPM = 11400 // troca de marcha logo antes da faixa vermelha

// Câmbio automático: a menor marcha que ainda alcança a velocidade atual.
export function gearFor(speed: number): number {
  const index = GEAR_TOPS.findIndex((top) => speed <= top * MAX_SPEED)
  return index === -1 ? GEARS : index + 1
}

export function rpmFor(speed: number): number {
  const top = GEAR_TOPS[gearFor(speed) - 1] * MAX_SPEED
  return Math.max(IDLE_RPM, (speed / top) * SHIFT_RPM)
}
