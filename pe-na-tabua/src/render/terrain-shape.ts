import { Color } from 'three'
import { RIDE_LIMIT, ROAD_HALF_WIDTH } from '../domain/track/constants'
import type { Track } from '../domain/track/types'
import type { TerrainPalette } from './theme/theme'

// Borda do asfalto desenhado, incluindo a zebra.
export const ROAD_EDGE = ROAD_HALF_WIDTH + 0.9
// Distâncias (m) a partir da borda onde o terreno tem vértices.
export const TERRAIN_OFFSETS = [0, 1.5, 3, 6, 8, 10, 16, 25, 38, 55, 80]
// Na cidade, calçada até a fachada dos prédios (m a partir da borda).
const SIDEWALK = RIDE_LIMIT + 0.5 - ROAD_EDGE

// Forma do chão de um lado da pista: vale, barranco até o mar, ou plano (cidade).
export type Ground = 'valley' | 'sea' | 'flat'

export function groundOf(track: Track, side: number): Ground {
  if (track.scenery.urban) return 'flat'
  return side === track.scenery.seaSide ? 'sea' : 'valley'
}

// Ondulação barata e contínua, entre -1 e 1.
export function hills(x: number, z: number): number {
  return 0.5 * Math.sin(x * 0.021 + Math.sin(z * 0.013) * 2) + 0.5 * Math.sin(z * 0.017 + x * 0.008)
}

// Altura do terreno relativa à pista, a `d` metros da borda. Forma um vale; do lado do mar
// é um barranco descendo até a água; na cidade é plano.
export function terrainHeight(d: number, x: number, z: number, ground: Ground = 'valley'): number {
  if (ground === 'flat') return -0.03
  if (d < 1.5) return -0.03 - d * 0.12
  const slope = Math.max(0, d - 3) ** 1.35
  if (ground === 'sea') return -0.3 - slope * 0.25 + hills(x, z) * Math.min(1, d / 20) * 1.5
  return -0.3 + slope * 0.07 + hills(x, z) * Math.min(1, d / 20) * 6
}

const scratch = new Color()

// Mato com manchas, pedra no alto dos morros; descendo para o mar, vira areia.
// Na cidade: calçada até os prédios, terreno cinza nos vãos entre eles.
export function terrainColor(d: number, height: number, x: number, z: number, palette: TerrainPalette, target: Color, ground: Ground = 'valley'): Color {
  if (d < (ground === 'flat' ? SIDEWALK : 1.5)) return target.set(palette.gravel)
  target.set(palette.grassDark).lerp(scratch.set(palette.grassLight), 0.5 + 0.5 * hills(x * 3.1, z * 2.7))
  const rocky = Math.min(1, Math.max(0, (height - 12) / 14))
  const sandy = Math.min(1, Math.max(0, (-height - 2) / 4))
  return target.lerp(scratch.set(palette.rock), rocky).lerp(scratch.set(palette.gravel), sandy)
}
