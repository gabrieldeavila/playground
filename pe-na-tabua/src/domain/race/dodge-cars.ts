import { clamp } from '../math'
import { ROAD_HALF_WIDTH } from '../track/constants'
import { CAR_HALF_LENGTH, CAR_HALF_WIDTH } from '../traffic/constants'
import { carVelocity } from '../traffic/step-traffic'
import type { Car } from '../traffic/types'
import { RIDER_RADIUS } from './constants'
import type { Rider } from './types'

const LOOK_TIME = 1.8 // s de antecedência para ver um carro no caminho
const PATH_HALF_WIDTH = CAR_HALF_WIDTH + RIDER_RADIUS + 0.5
const CLEARANCE = CAR_HALF_WIDTH + 1.7 // do centro do carro até a linha de desvio
const ROAD_LIMIT = ROAD_HALF_WIDTH - 0.6

// Se um carro vai cruzar o caminho do bot, devolve uma linha que passa ao lado dele (null = livre).
export function dodgeLine(rider: Rider, lineX: number, cars: Car[]): number | null {
  const threat = firstThreat(rider, lineX, cars)
  if (!threat) return null
  const sides = [threat.x - CLEARANCE, threat.x + CLEARANCE].filter((x) => Math.abs(x) <= ROAD_LIMIT)
  if (sides.length === 0) return null
  const nearest = sides.reduce((a, b) => (Math.abs(a - rider.x) <= Math.abs(b - rider.x) ? a : b))
  return clamp(nearest, -ROAD_LIMIT, ROAD_LIMIT)
}

// O carro que o bot alcança primeiro, se estiver no caminho dele ou na linha que ele quer.
function firstThreat(rider: Rider, lineX: number, cars: Car[]): Car | null {
  let threat: Car | null = null
  let soonest = LOOK_TIME
  for (const car of cars) {
    const gap = car.s - rider.s
    const closing = rider.speed - carVelocity(car)
    if (gap < -CAR_HALF_LENGTH || closing <= 0) continue
    const inPath = Math.min(Math.abs(car.x - rider.x), Math.abs(car.x - lineX)) < PATH_HALF_WIDTH
    const time = Math.max(0, gap) / closing
    if (inPath && time < soonest) {
      threat = car
      soonest = time
    }
  }
  return threat
}
