import { clamp, lerp } from '../math'
import type { Rng } from '../random'
import { LANE_CHANGE_EVERY, LANES, MERGE_GAP, MOVE_TIME, SIGNAL_TIME } from './constants'
import type { Car } from './types'

const BUSY_RANGE = 120 // m: perto de um carro já trocando de faixa, ninguém começa outra troca

// Daqui a quanto tempo o carro pensa de novo em trocar de faixa.
export const nextLaneChange = (rng: Rng) => LANE_CHANGE_EVERY * (0.5 + rng())

// A outra faixa do mesmo sentido (cada sentido tem duas).
export function neighborLane(lane: number): number | null {
  const index = LANES.findIndex((other, i) => i !== lane && other.direction === LANES[lane].direction)
  return index < 0 ? null : index
}

// Liga a seta de quem resolveu trocar e tem espaço para a troca inteira.
export function startLaneChanges(cars: Car[], trackLength: number, rng: Rng, dt: number): void {
  for (const car of cars) {
    if (car.change) continue
    car.changeTimer -= dt
    if (car.changeTimer > 0) continue
    car.changeTimer = nextLaneChange(rng)
    const to = neighborLane(car.lane)
    if (to !== null && hasRoom(car, to, cars, trackLength)) car.change = { from: car.lane, to, elapsed: 0 }
  }
}

// Seta, depois desliza de lado indo da velocidade de uma faixa para a da outra.
export function stepLaneChange(car: Car, dt: number): void {
  const change = car.change
  if (!change) return
  change.elapsed += dt
  const from = LANES[change.from]
  const to = LANES[change.to]
  const t = clamp((change.elapsed - SIGNAL_TIME) / MOVE_TIME, 0, 1)
  car.x = lerp(from.x, to.x, t * t * (3 - 2 * t))
  car.speed = lerp(from.speed, to.speed, t)
  if (t < 1) return
  car.lane = change.to
  car.change = null
}

// Para que lado a seta pisca, em coordenadas de pista (1 = direita, 0 = apagada).
export function signalSide(car: Car): -1 | 0 | 1 {
  if (!car.change) return 0
  return LANES[car.change.to].x > LANES[car.change.from].x ? 1 : -1
}

// Ninguém das duas faixas chega a menos de MERGE_GAP durante a troca. A velocidade do carro
// muda em linha reta, então a distância para cada outro só anda num sentido: basta olhar o
// começo e o fim do trecho em que ele atravessa.
function hasRoom(car: Car, to: number, cars: Car[], trackLength: number): boolean {
  const v0 = LANES[car.lane].speed
  const v1 = LANES[to].speed
  return cars.every((other) => {
    if (other === car || other.direction !== car.direction) return true
    const gap = aheadGap(car, other, trackLength)
    if (other.change) return Math.abs(gap) > BUSY_RANGE
    if (other.lane === to) return keepsApart(gap + (v1 - v0) * SIGNAL_TIME, ((v1 - v0) * MOVE_TIME) / 2)
    return keepsApart(gap, ((v0 - v1) * MOVE_TIME) / 2)
  })
}

// Quanto `other` está à frente de `car` no sentido em que eles andam (negativo = atrás).
function aheadGap(car: Car, other: Car, trackLength: number): number {
  const d = (((other.s - car.s) * car.direction) % trackLength + trackLength) % trackLength
  return d > trackLength / 2 ? d - trackLength : d
}

// A distância começa em `start` e anda `shift` até o fim da troca.
function keepsApart(start: number, shift: number): boolean {
  const end = start + shift
  return Math.sign(start) === Math.sign(end) && Math.min(Math.abs(start), Math.abs(end)) >= MERGE_GAP
}
