import { Vector3 } from 'three'
import type { Theme } from './theme'

// Litoral ao meio-dia: céu limpo, horizonte claro, ilhas baixas e mar de um lado.
export const COAST: Theme = {
  sky: { top: '#3a86d1', horizon: '#cfe6ee', ground: '#7d8f86', sun: '#fffbe8' },
  sunDirection: new Vector3(0.35, 0.72, 0.6).normalize(),
  fog: { near: 120, far: 900 },
  hemisphere: { sky: '#d6ecff', ground: '#8a7a52', intensity: 1.25 },
  sunLight: { color: '#fff4dc', intensity: 2.9 },
  backdrop: { colors: ['#6f8fa6', '#7e9bb0', '#89a4b4'], height: [40, 140], radius: [250, 600], distance: [1500, 2200] },
  terrain: { gravel: '#c9b48a', grassDark: '#6d8a3a', grassLight: '#9aae55', rock: '#8f8577' },
  sea: '#2b7fa8',
}
