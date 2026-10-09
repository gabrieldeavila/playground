import type { Course, Section } from './types'

// Largada, miolo e chegada em sequência: é isso que vira segmentos.
export function courseSections(course: Course): Section[] {
  return [...course.start, ...course.body, ...course.finish]
}

// Quantos segmentos os trechos ocupam.
export function sectionsLength(sections: Section[]): number {
  return sections.reduce((sum, section) => sum + section.enter + section.hold + section.leave, 0)
}
