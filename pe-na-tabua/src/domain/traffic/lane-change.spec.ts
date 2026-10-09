import { describe, expect, it } from 'vitest'
import { createRng } from '../random'
import { CAR_HALF_LENGTH, CAR_HALF_WIDTH, LANES, MOVE_TIME, SIGNAL_TIME } from './constants'
import { createTraffic } from './create-traffic'
import { neighborLane, signalSide, startLaneChanges, stepLaneChange } from './lane-change'
import { stepTraffic } from './step-traffic'
import { testCar } from './test-cars'
import type { Car } from './types'

const LENGTH = 5000
const always = () => 0 // rng que sempre sorteia o menor tempo de espera

// Põe o carro para pensar em trocar agora e devolve se ele ligou a seta.
function tries(car: Car, others: Car[]): boolean {
  car.changeTimer = 0
  startLaneChanges([car, ...others], LENGTH, always, 0.01)
  return car.change !== null
}

describe('troca de faixa', () => {
  it('a faixa vizinha é a outra do mesmo sentido', () => {
    expect([0, 1, 2, 3].map(neighborLane)).toEqual([1, 0, 3, 2])
  })

  it('pisca a seta, depois atravessa e fica com a velocidade da faixa nova', () => {
    const car = testCar({ lane: 0, x: LANES[0].x, speed: LANES[0].speed })
    expect(tries(car, [])).toBe(true)
    expect(signalSide(car)).toBe(-1) // faixa 1 fica à esquerda da 0
    stepLaneChange(car, SIGNAL_TIME * 0.9)
    expect(car.x).toBe(LANES[0].x)
    stepLaneChange(car, SIGNAL_TIME * 0.1 + MOVE_TIME / 2)
    expect(car.x).toBeCloseTo((LANES[0].x + LANES[1].x) / 2)
    stepLaneChange(car, MOVE_TIME)
    expect(car).toMatchObject({ lane: 1, x: LANES[1].x, speed: LANES[1].speed, change: null })
    expect(signalSide(car)).toBe(0)
  })

  it('não troca com um carro do lado na faixa de destino', () => {
    const car = testCar({ lane: 0, x: LANES[0].x, speed: LANES[0].speed, s: 1000 })
    const beside = testCar({ id: 1, lane: 1, s: 1005 })
    expect(tries(car, [beside])).toBe(false)
  })

  it('não entra na faixa rápida com um carro chegando logo atrás', () => {
    const car = testCar({ lane: 0, x: LANES[0].x, speed: LANES[0].speed, s: 1000 })
    const closing = testCar({ id: 1, lane: 1, s: 980 }) // 6 m/s mais rápido, 20 m atrás: chegaria a 13 m
    expect(tries(car, [closing])).toBe(false)
    expect(tries(car, [{ ...closing, s: 800 }])).toBe(true)
  })

  it('contramão também troca, entre as duas faixas dela', () => {
    const car = testCar({ lane: 2, x: LANES[2].x, speed: LANES[2].speed, direction: -1 })
    expect(tries(car, [])).toBe(true)
    expect(car.change!.to).toBe(3)
  })

  it('trânsito denso por 5 minutos: troca bastante de faixa e nenhum carro encosta no outro', () => {
    const rng = createRng(9)
    const cars = createTraffic(LENGTH, rng, 2)
    let changes = 0
    for (let t = 0; t < 300; t += 0.1) {
      const before = cars.filter((c) => c.change).length
      stepTraffic(cars, LENGTH, 0.1, rng)
      changes += Math.max(0, cars.filter((c) => c.change).length - before)
      expect(overlapping(cars)).toBeNull()
    }
    expect(changes).toBeGreaterThan(50)
  })
})

function overlapping(cars: Car[]): [number, number] | null {
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const [a, b] = [cars[i], cars[j]]
      const ds = Math.abs(a.s - b.s)
      const along = Math.min(ds, LENGTH - ds)
      if (along < CAR_HALF_LENGTH * 2 && Math.abs(a.x - b.x) < CAR_HALF_WIDTH * 2) return [a.id, b.id]
    }
  }
  return null
}
