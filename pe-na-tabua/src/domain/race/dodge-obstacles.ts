import { clamp } from '../math'
import { CONE_RADIUS, PEDESTRIAN_RADIUS } from '../street/constants'
import type { Street } from '../street/types'
import { ROAD_HALF_WIDTH } from '../track/constants'
import { CAR_HALF_LENGTH, CAR_HALF_WIDTH } from '../traffic/constants'
import { carVelocity } from '../traffic/step-traffic'
import type { Car } from '../traffic/types'
import { RIDER_RADIUS } from './constants'
import type { Rider } from './types'

const LOOK_TIME = 1.8 // s de antecedência para ver algo no caminho
const PATH_MARGIN = RIDER_RADIUS + 0.5 // somado à meia largura do obstáculo
const CLEARANCE_MARGIN = 1.7 // do lado do obstáculo até a linha de desvio
const ROAD_LIMIT = ROAD_HALF_WIDTH - 0.6

interface Threat {
  x: number
  halfWidth: number
  time: number // s até o bot chegar nele
}

// Se um carro, pedestre, cone ou buraco vai cruzar o caminho do bot, devolve uma linha que
// passa ao lado dele (null = livre).
export function dodgeLine(rider: Rider, lineX: number, cars: Car[], street?: Street): number | null {
  const threat = firstThreat(rider, lineX, cars, street)
  if (!threat) return null
  const clearance = threat.halfWidth + CLEARANCE_MARGIN
  const sides = [threat.x - clearance, threat.x + clearance].filter((x) => Math.abs(x) <= ROAD_LIMIT)
  if (sides.length === 0) return null
  const nearest = sides.reduce((a, b) => (Math.abs(a - rider.x) <= Math.abs(b - rider.x) ? a : b))
  return clamp(nearest, -ROAD_LIMIT, ROAD_LIMIT)
}

// O que o bot alcança primeiro, se estiver no caminho dele ou na linha que ele quer.
function firstThreat(rider: Rider, lineX: number, cars: Car[], street?: Street): Threat | null {
  let threat: Threat | null = null
  const consider = (s: number, x: number, velocity: number, halfWidth: number, halfLength: number) => {
    const gap = s - rider.s
    const closing = rider.speed - velocity
    if (gap < -halfLength || closing <= 0) return
    const inPath = Math.min(Math.abs(x - rider.x), Math.abs(x - lineX)) < halfWidth + PATH_MARGIN
    const time = Math.max(0, gap) / closing
    if (inPath && time < (threat?.time ?? LOOK_TIME)) threat = { x, halfWidth, time }
  }
  for (const car of cars) consider(car.s, car.x, carVelocity(car), CAR_HALF_WIDTH, CAR_HALF_LENGTH)
  if (!street) return threat
  for (const cone of street.cones) if (!cone.flight) consider(cone.s, cone.x, 0, CONE_RADIUS, CONE_RADIUS)
  for (const ped of street.pedestrians) if (ped.state !== 'down') consider(ped.s, ped.x, 0, PEDESTRIAN_RADIUS, PEDESTRIAN_RADIUS)
  for (const hole of street.potholes) consider(hole.s, hole.x, 0, hole.radius, hole.radius)
  return threat
}
