import type { Vector3 } from 'three'

export interface TerrainPalette {
  gravel: string // acostamento (areia, no litoral)
  grassDark: string
  grassLight: string
  rock: string // topo dos morros
}

export interface BackdropStyle {
  colors: string[]
  height: [number, number] // m, mín e máx
  radius: [number, number]
  distance: [number, number] // da câmera
}

// Tudo que muda de uma pista para a outra no visual.
export interface Theme {
  sky: { top: string; horizon: string; ground: string; sun: string } // horizonte = cor da neblina
  sunDirection: Vector3
  fog: { near: number; far: number }
  hemisphere: { sky: string; ground: string; intensity: number }
  sunLight: { color: string; intensity: number }
  backdrop: BackdropStyle
  terrain: TerrainPalette
  sea: string | null // cor da água; null = sem mar
}
