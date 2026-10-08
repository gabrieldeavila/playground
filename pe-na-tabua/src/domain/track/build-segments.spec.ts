import { describe, expect, it } from 'vitest'
import { buildSegments } from './build-segments'

describe('buildSegments', () => {
  const sections = [
    { enter: 5, hold: 10, leave: 5, curve: 0.01, hill: 20 },
    { enter: 0, hold: 8, leave: 0, curve: 0, hill: -5 },
  ]

  it('gera um segmento por passo de cada trecho', () => {
    expect(buildSegments(sections)).toHaveLength(28)
  })

  it('suaviza a curva na entrada e segura o valor no meio', () => {
    const segments = buildSegments(sections)
    expect(segments[0].curve).toBe(0)
    expect(segments[2].curve).toBeLessThan(0.01)
    expect(segments[10].curve).toBe(0.01)
  })

  it('termina na soma das alturas, sem degraus entre segmentos', () => {
    const segments = buildSegments(sections)
    expect(segments.at(-1)!.y1).toBeCloseTo(15)
    for (let i = 1; i < segments.length; i++) expect(segments[i].y0).toBeCloseTo(segments[i - 1].y1)
  })
})
