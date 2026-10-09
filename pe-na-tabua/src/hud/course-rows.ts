import type { Career } from '../domain/career/career'
import type { Level } from '../domain/career/levels'
import { finishDistance } from '../domain/track/finish-distance'
import { stretchCourse } from '../domain/track/stretch-course'
import type { Course } from '../domain/track/types'

export interface CourseRow {
  name: string
  km: string // "5.4"
  cleared: boolean
}

// Uma linha por pista do nível, com o tamanho dela nesse nível e se já foi passada.
export function courseRows(career: Career, level: Level, courses: Course[]): CourseRow[] {
  const levelDone = level.number < career.level || career.champion
  return courses.map((course) => ({
    name: course.name,
    km: (finishDistance(stretchCourse(course, level.lengthScale)) / 1000).toFixed(1),
    cleared: levelDone || (level.number === career.level && career.cleared.includes(course.name)),
  }))
}
