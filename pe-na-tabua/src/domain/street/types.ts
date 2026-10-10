import type { Rng } from '../random'

// Voo de quem levou uma pancada (cone ou pedestre): sobe, gira e cai deitado.
export interface Flight {
  vs: number // m/s ao longo da pista
  vx: number // m/s de lado
  vy: number // m/s para cima
  y: number // altura acima do asfalto (m)
  spin: number // rad/s
  angle: number // quanto já tombou (rad); deitado = PI / 2
  landed: boolean
}

// Buraco no asfalto: não derruba, mas tira velocidade e dá um tranco no guidão.
export interface Pothole {
  s: number
  x: number
  radius: number
}

// Cone de obra. Parado até alguém (moto ou carro) acertar; aí voa e fica caído.
export interface Cone {
  id: number
  s: number
  x: number
  flight: Flight | null
}

export type PedestrianState = 'waiting' | 'crossing' | 'down'

// Pedestre: espera na calçada, atravessa quando não vem carro, volta depois.
// Atropelado, voa, fica caído um tempo e sai andando para a calçada mais perto.
export interface Pedestrian {
  id: number
  s: number
  x: number
  side: -1 | 1 // calçada onde está (waiting) ou para onde vai (crossing)
  walkSpeed: number // m/s
  state: PedestrianState
  timer: number // waiting: s até tentar atravessar; down: s até levantar
  flight: Flight | null
}

// Tudo o que a rua da cidade põe no caminho. Em pista que não é cidade, tudo vazio.
export interface Street {
  crosswalks: number[] // s de cada faixa de pedestres
  potholes: Pothole[] // ordenados por s
  cones: Cone[]
  pedestrians: Pedestrian[]
  rng: Rng // separado do da corrida: as outras pistas sorteiam igual a antes
}
