import { GRID_FRONT_S } from '../race/constants'
import type { Lane } from './types'

// Duas faixas em cada sentido. Velocidade fixa por faixa: carros da mesma faixa nunca se encostam.
export const LANES: Lane[] = [
  { x: 4.9, direction: 1, speed: 16, cars: 16 },
  { x: 1.6, direction: 1, speed: 22, cars: 14 },
  { x: -1.6, direction: -1, speed: 21, cars: 14 },
  { x: -4.9, direction: -1, speed: 15, cars: 14 },
]

export const CAR_HALF_WIDTH = 0.95
export const CAR_HALF_LENGTH = 2.2
export const CAR_CRASH_DAMAGE = 25
export const CAR_CRASH_MIN_SPEED = 5 // velocidade relativa mínima para derrubar (m/s)
export const TAXI_SHARE = 0.3

// Nenhum carro nasce em cima do grid de largada.
export const CLEAR_START = GRID_FRONT_S + 60
