import { describe, expect, it } from 'vitest'
import { SERRA } from './courses/serra'
import { createTrack } from './create-track'
import { finishDistance } from './finish-distance'

describe('finishDistance', () => {
  it('bate com a chegada da pista montada', () => {
    expect(finishDistance(SERRA)).toBe(createTrack(SERRA).finishS)
  })
})
