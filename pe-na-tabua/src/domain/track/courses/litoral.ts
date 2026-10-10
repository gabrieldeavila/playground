import type { Course } from '../types'
import { section } from './section'

// Estrada litorânea: ~4,6 km colada no mar (à esquerda), quase plana, curvas longas e
// retas de praia. Pouca árvore, mais pedra.
export const LITORAL: Course = {
  name: 'Litoral',
  seed: 21,
  theme: 'coast',
  scenery: { treeChance: 0.08, nearTreeChance: 0.05, rockChance: 0.07, pineShare: 0.15, seaSide: -1, urban: false },
  start: [section(0, 40, 0)],
  body: [
    section(20, 60, 20, 0.004, 4),
    section(0, 80, 0),
    section(25, 50, 25, -0.007, -3),
    section(15, 40, 15, 0.009, 6),
    section(15, 30, 15, -0.009, 0),
    section(10, 120, 10, 0, -4),
    section(30, 60, 30, 0.005, 8),
    section(20, 30, 20, -0.012, -6),
    section(20, 30, 20, 0.012, 0),
    section(0, 60, 0, 0, -6),
    section(25, 70, 25, -0.004, 4),
    section(15, 25, 15, 0.008, 0),
  ],
  finish: [
    section(10, 60, 0),
    // Reta de escape depois da chegada (RUNOFF_LENGTH).
    section(0, 60, 0),
  ],
}
