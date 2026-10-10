import { Vector3 } from 'three'
import type { Theme } from './theme'

// Cidade no fim da tarde: céu de fumaça alaranjada, neblina mais perto, prédios no horizonte,
// calçada de concreto e meio-fio cinza no lugar da zebra.
export const CITY: Theme = {
  sky: { top: '#27335f', horizon: '#e39a72', ground: '#4a4a50', sun: '#ffd9ae' },
  sunDirection: new Vector3(0.5, 0.32, -0.6).normalize(),
  fog: { near: 70, far: 560 },
  hemisphere: { sky: '#c0cbe6', ground: '#4b4740', intensity: 1.15 },
  sunLight: { color: '#ffd6a6', intensity: 2.4 },
  backdrop: { shape: 'towers', colors: ['#4a5170', '#56597a', '#3f4866'], height: [80, 260], radius: [25, 70], distance: [900, 1400] },
  terrain: { gravel: '#a29f97', grassDark: '#55565b', grassLight: '#68696d', rock: '#77777a' },
  rumble: ['#8f8e8a', '#b9b7af'],
  sea: null,
}
