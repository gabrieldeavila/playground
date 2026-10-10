import { describe, expect, it } from 'vitest'
import { DEFAULT_VOLUMES, MAX_VOLUME, adjustVolume, volumeGain } from './volumes'

describe('volumes', () => {
  it('ajusta um volume só, sem passar dos limites', () => {
    const louder = adjustVolume(DEFAULT_VOLUMES, 'music', 1)
    expect(louder.music).toBe(DEFAULT_VOLUMES.music + 1)
    expect(louder.engine).toBe(DEFAULT_VOLUMES.engine)
    expect(adjustVolume({ ...DEFAULT_VOLUMES, engine: 0 }, 'engine', -1).engine).toBe(0)
    expect(adjustVolume({ ...DEFAULT_VOLUMES, master: MAX_VOLUME }, 'master', 1).master).toBe(MAX_VOLUME)
  })

  it('padrão mantém a mixagem, zero cala', () => {
    expect(volumeGain(DEFAULT_VOLUMES.master)).toBe(1)
    expect(volumeGain(0)).toBe(0)
    expect(volumeGain(MAX_VOLUME)).toBeGreaterThan(1)
  })
})
