import type { Course } from '../types'
import { section } from './section'

// Estrada de serra: ~5,4 km até a chegada, com subidas, cristas e S.
export const SERRA: Course = {
  name: 'Serra',
  seed: 7,
  theme: 'mountain',
  scenery: { treeChance: 0.3, nearTreeChance: 0.12, rockChance: 0.035, pineShare: 0.55, seaSide: 0 },
  start: [section(0, 40, 0)],
  body: [
    section(20, 40, 20, 0.006, 10),
    section(10, 30, 10, 0, 25),
    section(15, 25, 15, -0.01, -10),
    section(15, 25, 15, 0.01, -15),
    section(10, 60, 10, 0, -30),
    section(30, 80, 30, 0.004, 20),
    section(10, 20, 10, 0, 30),
    section(10, 20, 10, 0, -35),
    section(20, 30, 20, -0.014, 0),
    section(0, 50, 0),
    section(10, 10, 10, 0.012, 0),
    section(10, 10, 10, -0.012, 0),
    section(20, 100, 20, -0.003, 60),
    section(15, 20, 15, 0.009, -20),
    section(15, 20, 15, -0.009, -20),
    section(15, 20, 15, 0.009, -20),
    section(10, 20, 10, 0, 15),
    section(10, 20, 10, 0, -15),
    section(10, 20, 10, 0, 15),
    section(10, 20, 10, 0, -15),
    section(20, 40, 20, 0.007, 0),
  ],
  finish: [
    section(10, 60, 0),
    // Reta de escape depois da chegada (RUNOFF_LENGTH).
    section(0, 60, 0),
  ],
}
