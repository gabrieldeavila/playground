import { describe, expect, it } from 'vitest'
import { CENTRO } from '../track/courses/centro'
import { SERRA } from '../track/courses/serra'
import { createTrack } from '../track/create-track'
import { HAZARD_FREE_FINISH, HAZARD_FREE_START, SIDEWALK_X } from './constants'
import { createStreet } from './create-street'
import { isStraight } from './street-span'

const city = createTrack(CENTRO)

describe('createStreet', () => {
  it('fora da cidade a rua vem vazia', () => {
    const street = createStreet(createTrack(SERRA), 1)
    expect([street.crosswalks, street.potholes, street.cones, street.pedestrians].every((list) => list.length === 0)).toBe(true)
  })

  it('na cidade tem faixas, obras, buracos e pedestres, longe da largada e da chegada', () => {
    const street = createStreet(city, 1)
    for (const list of [street.crosswalks, street.potholes, street.cones, street.pedestrians]) expect(list.length).toBeGreaterThan(0)
    const spots = [...street.crosswalks, ...street.potholes.map((p) => p.s), ...street.cones.map((c) => c.s)]
    expect(spots.every((s) => s >= HAZARD_FREE_START && s <= city.finishS - HAZARD_FREE_FINISH)).toBe(true)
  })

  it('faixas de pedestres e obras ficam nas retas', () => {
    const street = createStreet(city, 2)
    expect(street.crosswalks.every((s) => isStraight(city, s - 4, s + 4))).toBe(true)
    expect(street.cones.every((cone) => isStraight(city, cone.s, cone.s))).toBe(true)
  })

  it('pedestres começam esperando na calçada', () => {
    const { pedestrians } = createStreet(city, 3)
    expect(pedestrians.every((p) => p.state === 'waiting' && Math.abs(p.x) === SIDEWALK_X)).toBe(true)
  })

  it('a densidade do desafio multiplica o que vai na rua', () => {
    const count = (scale: number) => {
      const street = createStreet(city, 4, scale)
      return street.potholes.length + street.cones.length + street.pedestrians.length
    }
    expect(count(1.4)).toBeGreaterThan(count(0.5))
  })

  it('mesma semente, mesma rua', () => {
    expect(createStreet(city, 5).potholes).toEqual(createStreet(city, 5).potholes)
  })
})
