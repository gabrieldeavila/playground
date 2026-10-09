import { sectionsLength } from './course-sections'
import type { Course, Section } from './types'

// Repete o miolo da pista até ele ter `lengthScale` vezes o tamanho original.
// Repetições ímpares vêm espelhadas (curvas para o outro lado): não parece a mesma estrada
// de novo, e uma curva desfaz a outra, então a pista não volta por cima de si mesma.
export function stretchCourse(course: Course, lengthScale: number): Course {
  if (course.body.length === 0) return course
  const goal = sectionsLength(course.body) * lengthScale
  const body: Section[] = []
  let length = 0
  for (let i = 0; length < goal; i++) {
    const section = repeatOf(course.body, i)
    body.push(section)
    length += sectionsLength([section])
  }
  return { ...course, body }
}

function repeatOf(body: Section[], i: number): Section {
  const section = body[i % body.length]
  const mirrored = Math.floor(i / body.length) % 2 === 1
  return mirrored ? { ...section, curve: -section.curve } : section
}
