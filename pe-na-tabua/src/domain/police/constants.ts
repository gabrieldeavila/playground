import { ROAD_HALF_WIDTH } from '../track/constants'

export const COP_SPEED_FACTOR = 1.05 // moto da polícia é um pouco mais rápida: alcança quem não cai
export const PATROL_X = ROAD_HALF_WIDTH + 0.6 // parado no acostamento, fora das faixas dos carros
export const ALERT_RANGE = 70 // m antes do policial em que o jogador é visto

// Preso: policial colado no jogador caído ou quase parado, por um tempinho.
export const BUST_RANGE_S = 4
export const BUST_RANGE_X = 3
export const BUST_SPEED = 4 // m/s
export const BUST_TIME = 0.8 // s

export const MATCH_GAIN = 0.8 // quanto o policial acelera por metro de distância até o jogador (1/s)
export const COP_ATTACKS_PER_SECOND = 0.55
