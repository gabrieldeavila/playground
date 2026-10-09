import { Color } from 'three'
import { ROAD_HALF_WIDTH } from '../domain/track/constants'
import type { TerrainPalette } from './theme/theme'

// Borda do asfalto desenhado, incluindo a zebra.
export const ROAD_EDGE = ROAD_HALF_WIDTH + 0.9
// Distâncias (m) a partir da borda onde o terreno tem vértices.
export const TERRAIN_OFFSETS = [0, 1.5, 3, 6, 10, 16, 25, 38, 55, 80]


// Ondulação barata e contínua, entre -1 e 1.
export function hills(x: number, z: number): number {
  return 0.5 * Math.sin(x * 0.021 + Math.sin(z * 0.013) * 2) + 0.5 * Math.sin(z * 0.017 + x * 0.008)
}

// Altura do terreno relativa à pista, a `d` metros da borda. Forma um vale; do lado do mar
// (`toSea`) é um barranco descendo até a água.
export function terrainHeight(d: number, x: number, z: number, toSea = false): number {
  if (d < 1.5) return -0.03 - d * 0.12
  const slope = Math.max(0, d - 3) ** 1.35
  if (toSea) return -0.3 - slope * 0.25 + hills(x, z) * Math.min(1, d / 20) * 1.5
  return -0.3 + slope * 0.07 + hills(x, z) * Math.min(1, d / 20) * 6
}

const scratch = new Color()

// Mato com manchas, pedra no alto dos morros; descendo para o mar, vira areia.
export function terrainColor(d: number, height: number, x: number, z: number, palette: TerrainPalette, target: Color): Color {
  if (d < 1.5) return target.set(palette.gravel)
  target.set(palette.grassDark).lerp(scratch.set(palette.grassLight), 0.5 + 0.5 * hills(x * 3.1, z * 2.7))
  const rocky = Math.min(1, Math.max(0, (height - 12) / 14))
  const sandy = Math.min(1, Math.max(0, (-height - 2) / 4))
  return target.lerp(scratch.set(palette.rock), rocky).lerp(scratch.set(palette.gravel), sandy)
}
