import { describe, expect, it } from 'vitest'
import { DIFFICULTIES } from './difficulty'
import { LEVELS } from './levels'

describe('DIFFICULTIES', () => {
  it('cada modo tem uma intensidade por nível, sempre subindo', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(difficulty.intensity).toHaveLength(LEVELS.length)
      for (let i = 1; i < LEVELS.length; i++) expect(difficulty.intensity[i]).toBeGreaterThan(difficulty.intensity[i - 1])
    }
  })

  it('Joyride nunca chega no jogo de hoje; Racer chega no último nível; Outlaw começa nele', () => {
    const [joyride, racer, outlaw] = DIFFICULTIES
    expect(Math.max(...joyride.intensity)).toBeLessThan(1)
    expect(racer.intensity[0]).toBeLessThan(1)
    expect(racer.intensity[LEVELS.length - 1]).toBe(1)
    expect(outlaw.intensity[0]).toBe(1)
  })
})
