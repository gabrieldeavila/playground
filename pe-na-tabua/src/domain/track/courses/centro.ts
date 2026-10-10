import type { Course } from '../types'
import { section } from './section'

// Centro da cidade: ~5,4 km até a chegada (como a Serra), avenidas retas entre prédios,
// esquinas de 90° (raio 40 m: tem que frear até ~180 km/h), chicanes e quase nada de morro.
// Pedestres, obras e buracos vêm da rua (domain/street), não daqui.
export const CENTRO: Course = {
  name: 'Centro',
  seed: 33,
  theme: 'city',
  scenery: { treeChance: 0, nearTreeChance: 0.05, rockChance: 0, pineShare: 0, seaSide: 0, urban: true },
  start: [section(0, 40, 0)],
  body: [
    section(0, 70, 0, 0, 2),
    section(3, 13, 3, 0.025), // esquina à direita
    section(0, 50, 0),
    section(3, 13, 3, -0.025), // esquina à esquerda
    section(10, 60, 10, 0.002, 4), // avenida com uma curva bem aberta
    section(0, 40, 0, 0, -4),
    section(4, 6, 4, 0.022),
    section(0, 60, 0),
    section(4, 6, 4, -0.022),
    section(0, 45, 0, 0, 3),
    section(3, 5, 3, 0.025), // chicane
    section(3, 5, 3, -0.025),
    section(0, 80, 0, 0, -3),
    section(3, 13, 3, -0.025),
    section(0, 50, 0),
    section(3, 13, 3, 0.025),
    section(0, 70, 0, 0, 5),
    section(15, 30, 15, -0.008),
    section(0, 60, 0, 0, -5),
    section(3, 13, 3, 0.025),
    section(0, 40, 0, 0, 2),
    section(3, 13, 3, -0.025),
    section(0, 50, 0, 0, -2),
    section(0, 60, 0, 0, 3),
    section(3, 13, 3, 0.025),
    section(0, 45, 0),
    section(4, 6, 4, -0.022),
    section(0, 70, 0, 0, -3),
    section(3, 5, 3, -0.025), // chicane ao contrário
    section(3, 5, 3, 0.025),
    section(0, 55, 0, 0, 2),
    section(3, 13, 3, -0.025),
    section(0, 40, 0),
  ],
  finish: [
    section(10, 60, 0),
    // Reta de escape depois da chegada (RUNOFF_LENGTH).
    section(0, 60, 0),
  ],
}
