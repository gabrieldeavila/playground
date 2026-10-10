import type { Course } from '../types'
import { CENTRO } from './centro'
import { LITORAL } from './litoral'
import { SERRA } from './serra'

// Pistas de cada nível, na ordem em que aparecem.
export const COURSES: Course[] = [SERRA, LITORAL, CENTRO]
