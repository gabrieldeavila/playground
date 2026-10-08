import { describe, expect, it } from 'vitest'
import { propsPassed } from './props-passed'
import type { Prop, Track } from './types'

const prop = (s: number): Prop => ({ kind: 'post', s, x: 8, scale: 1, rotation: 0 })
const track = { props: [10, 20, 20, 35].map(prop) } as Track

describe('propsPassed', () => {
  it('pega só o que ficou entre o quadro anterior e o atual', () => {
    expect(propsPassed(track, 12, 30).map((p) => p.s)).toEqual([20, 20])
  })

  it('não conta duas vezes um prop exatamente na borda', () => {
    expect(propsPassed(track, 5, 20)).toHaveLength(3)
    expect(propsPassed(track, 20, 40).map((p) => p.s)).toEqual([35])
  })
})
