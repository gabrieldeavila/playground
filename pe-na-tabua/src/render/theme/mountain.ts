import { Vector3 } from 'three'
import type { Theme } from './theme'

// Serra no fim de tarde: céu azul em cima, horizonte alaranjado, montanhas lilás.
export const MOUNTAIN: Theme = {
  sky: { top: '#2f5fb3', horizon: '#f4b98a', ground: '#6d7356', sun: '#fff1d6' },
  sunDirection: new Vector3(-0.6, 0.38, 0.7).normalize(),
  fog: { near: 90, far: 700 },
  hemisphere: { sky: '#bfd6ff', ground: '#4a5a2a', intensity: 1.1 },
  sunLight: { color: '#ffe2b8', intensity: 2.6 },
  backdrop: { colors: ['#7b7fa6', '#8f88a8', '#6f7899'], height: [140, 400], radius: [200, 420], distance: [1300, 1800] },
  terrain: { gravel: '#8a7f6a', grassDark: '#466d33', grassLight: '#6f9347', rock: '#857a6c' },
  sea: null,
}
