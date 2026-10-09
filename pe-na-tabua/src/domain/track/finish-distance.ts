import { RUNOFF_LENGTH, SEGMENT_LENGTH } from './constants'
import { courseSections, sectionsLength } from './course-sections'
import type { Course } from './types'

// Metros da largada até a chegada, sem montar a pista.
export function finishDistance(course: Course): number {
  return sectionsLength(courseSections(course)) * SEGMENT_LENGTH - RUNOFF_LENGTH
}
