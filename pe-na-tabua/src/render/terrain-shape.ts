import { Color } from 'three'
import { ROAD_HALF_WIDTH } from '../domain/track/constants'

// Borda do asfalto desenhado, incluindo a zebra.
export const ROAD_EDGE = ROAD_HALF_WIDTH + 0.9
// Distâncias (m) a partir da borda onde o terreno tem vértices.
export const TERRAIN_OFFSETS = [0, 1.5, 3, 6, 10, 16, 25, 38, 55, 80]

const GRAVEL = new Color('#8a7f6a')
const GRASS_DARK = new Color('#466d33')
const GRASS_LIGHT = new Color('#6f9347')
const ROCK = new Color('#857a6c')

// Ondulação barata e contínua, entre -1 e 1.
export function hills(x: number, z: number): number {
  return 0.5 * Math.sin(x * 0.021 + Math.sin(z * 0.013) * 2) + 0.5 * Math.sin(z * 0.017 + x * 0.008)
}

// Altura do terreno relativa à pista, a `d` metros da borda. Forma um vale.
export function terrainHeight(d: number, x: number, z: number): number {
  if (d < 1.5) return -0.03 - d * 0.12
  const rise = Math.max(0, d - 3) ** 1.35 * 0.07
  const bumps = hills(x, z) * Math.min(1, d / 20) * 6
  return -0.3 + rise + bumps
}

export function terrainColor(d: number, height: number, x: number, z: number, target: Color): Color {
  if (d < 1.5) return target.copy(GRAVEL)
  target.copy(GRASS_DARK).lerp(GRASS_LIGHT, 0.5 + 0.5 * hills(x * 3.1, z * 2.7))
  const rocky = Math.min(1, Math.max(0, (height - 12) / 14))
  return target.lerp(ROCK, rocky)
}
