import { clamp } from '../domain/math'
import { MAX_SPEED } from '../domain/race/constants'
import { IDLE_RPM } from '../domain/race/gearbox'

const CYLINDERS = 4
const IMPACT_RANGE = 40 // m: golpes e tombos mais longe que isso não se ouvem
export const HEARING_RANGE = 12 // m de lado: até onde um objeto faz "vush" ao passar

const ratio = (speed: number) => clamp(speed / MAX_SPEED, 0, 1)

// Explosões por segundo de um 4 cilindros 4 tempos (cada cilindro explode a cada 2 voltas).
export const engineHz = (rpm: number) => (rpm / 60) * (CYLINDERS / 2)

// Acelerando o ronco abre (mais agudos); aliviando fica abafado.
export const engineCutoff = (rpm: number, throttle: number) => 250 + rpm * 0.08 + throttle * 1100

export const engineGain = (throttle: number) => 0.09 + throttle * 0.06

// Música mais alta nos menus; na corrida abre espaço para o motor e os golpes.
const MUSIC_MENU = 0.55
const MUSIC_RACE = 0.38
export const musicVolume = (racing: boolean) => (racing ? MUSIC_RACE : MUSIC_MENU)

// Parado no grid, o acelerador só sobe o giro.
export const revRpm = (throttle: number) => IDLE_RPM + throttle * 7500

// Vento cresce com o quadrado da velocidade, como o arrasto, e fica mais agudo.
export const windGain = (speed: number) => 0.35 * ratio(speed) ** 2
export const windCutoff = (speed: number) => 300 + 2200 * ratio(speed)

export const scrapeGain = (speed: number) => 0.12 + 0.25 * ratio(speed)

// "Vush" ao passar por algo: mais alto quanto mais rápido e mais perto.
export function whooshGain(speed: number, lateral: number): number {
  const distance = Math.abs(lateral)
  if (distance >= HEARING_RANGE) return 0
  return 0.5 * ratio(speed) * (1 - distance / HEARING_RANGE) ** 2
}

// Buzina mais alta quanto mais perto o carro está.
export const hornGain = (distance: number) => 0.22 * clamp(1 - distance / 150, 0.3, 1)

// Sirene começa a aparecer a SIREN_RANGE metros e cresce chegando perto.
export const SIREN_RANGE = 200
export function sirenGain(distance: number): number {
  return distance >= SIREN_RANGE ? 0 : 0.16 * (1 - distance / SIREN_RANGE) ** 1.5
}

// -1 esquerda .. 1 direita.
export const panFor = (lateral: number) => clamp(lateral / 5, -1, 1)

export function impactGain(distance: number): number {
  return distance >= IMPACT_RANGE ? 0 : (1 - distance / IMPACT_RANGE) ** 2
}
