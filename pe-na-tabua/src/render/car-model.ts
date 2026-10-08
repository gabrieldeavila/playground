import { BoxGeometry, type BufferGeometry, CylinderGeometry } from 'three'
import type { Car, CarKind } from '../domain/traffic/types'
import { mergeParts, paint } from './painted-geometry'

const SEDAN_COLORS = ['#b23a2e', '#2c3e50', '#e6e8ea', '#8a9199', '#2e6fb7', '#1f6e43', '#5b2c6f', '#a35a1c']
const TAXI_YELLOW = '#f2c21b'
const GLASS = '#26303a'
const TRIM = '#232529'

export function carColor(car: Car): string {
  return car.kind === 'taxi' ? TAXI_YELLOW : SEDAN_COLORS[car.id % SEDAN_COLORS.length]
}

// Carro low-poly de ~4,4 m com a base em y = 0. Frente = -z, como as motos.
export function createCarGeometry(kind: CarKind, color: string): BufferGeometry {
  const parts = [...body(color), ...wheels(), ...lights()]
  if (kind === 'taxi') parts.push(...taxiDetails())
  return mergeParts(parts)
}

function body(color: string): BufferGeometry[] {
  return [
    paint(new BoxGeometry(1.8, 0.62, 4.4), color, 0, 0.62),
    paint(new BoxGeometry(1.84, 0.18, 4.46), TRIM, 0, 0.38),
    paint(new BoxGeometry(1.6, 0.58, 2.3), GLASS, 0, 1.22, 0.25),
    paint(new BoxGeometry(1.62, 0.08, 1.9), color, 0, 1.53, 0.3),
  ]
}

function wheels(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (const x of [-0.82, 0.82]) {
    for (const z of [-1.35, 1.35]) parts.push(paint(new CylinderGeometry(0.34, 0.34, 0.28, 10).rotateZ(Math.PI / 2), '#151515', x, 0.34, z))
  }
  return parts
}

function lights(): BufferGeometry[] {
  const parts = [paint(new BoxGeometry(0.7, 0.18, 0.04), '#1b1b1b', 0, 0.74, -2.21)]
  for (const x of [-0.6, 0.6]) {
    parts.push(paint(new BoxGeometry(0.4, 0.16, 0.04), '#fff4c8', x, 0.78, -2.21))
    parts.push(paint(new BoxGeometry(0.36, 0.14, 0.04), '#d8261c', x, 0.8, 2.21))
  }
  return parts
}

// Luminoso no teto e faixa quadriculada nas laterais.
function taxiDetails(): BufferGeometry[] {
  const parts = [
    paint(new BoxGeometry(0.7, 0.24, 0.32), '#fbfbf2', 0, 1.69, 0.3),
    paint(new BoxGeometry(0.72, 0.06, 0.34), '#1b1b1b', 0, 1.58, 0.3),
  ]
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const color = i % 2 === 0 ? '#111111' : '#f5f5f5'
      parts.push(paint(new BoxGeometry(0.02, 0.12, 0.25), color, side * 0.905, 0.8, -1.4 + i * 0.25))
    }
  }
  return parts
}
