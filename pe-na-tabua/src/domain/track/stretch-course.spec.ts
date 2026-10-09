import { describe, expect, it } from 'vitest'
import { courseSections, sectionsLength } from './course-sections'
import { SERRA } from './courses/serra'
import { stretchCourse } from './stretch-course'
import type { Course } from './types'

const straight = { enter: 0, hold: 10, leave: 0, curve: 0, hill: 0 }
const left = { enter: 0, hold: 10, leave: 0, curve: -0.01, hill: 5 }
const right = { enter: 0, hold: 20, leave: 0, curve: 0.01, hill: -5 }

const course: Course = { ...SERRA, name: 'Teste', seed: 1, start: [straight], body: [left, right], finish: [straight] }

describe('stretchCourse', () => {
  it('no tamanho original devolve a mesma pista', () => {
    expect(stretchCourse(SERRA, 1)).toEqual(SERRA)
  })

  it('cresce só o miolo, até pelo menos o tamanho pedido', () => {
    const long = stretchCourse(course, 2)
    expect(long.start).toEqual(course.start)
    expect(long.finish).toEqual(course.finish)
    expect(sectionsLength(long.body)).toBeGreaterThanOrEqual(2 * sectionsLength(course.body))
  })

  it('a repetição vem espelhada: curvas para o outro lado, mesmos morros', () => {
    const long = stretchCourse(course, 2)
    expect(long.body).toEqual([left, right, { ...left, curve: 0.01 }, { ...right, curve: -0.01 }])
  })

  it('a Serra esticada continua começando e terminando igual', () => {
    const sections = courseSections(stretchCourse(SERRA, 1.5))
    expect(sections[0]).toEqual(SERRA.start[0])
    expect(sections.slice(-SERRA.finish.length)).toEqual(SERRA.finish)
  })
})
