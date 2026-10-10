import { describe, expect, it } from 'vitest'
import { DEFAULT_VOLUMES } from '../domain/settings/volumes'
import { parseVolumes } from './parse-volumes'

describe('parseVolumes', () => {
  it('sem nada salvo, usa o padrão', () => {
    expect(parseVolumes(null)).toEqual(DEFAULT_VOLUMES)
    expect(parseVolumes('{quebrado')).toEqual(DEFAULT_VOLUMES)
  })

  it('mantém os válidos e troca só os estranhos', () => {
    const volumes = parseVolumes(JSON.stringify({ music: 3, engine: 99, effects: 'alto' }))
    expect(volumes).toEqual({ ...DEFAULT_VOLUMES, music: 3 })
  })
})
