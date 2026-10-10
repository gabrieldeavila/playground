import { describe, expect, it } from 'vitest'
import { DEFAULT_VOLUMES } from '../domain/settings/volumes'
import { SoundMenu } from './sound-menu'

describe('SoundMenu', () => {
  it('setas escolhem a linha e mudam só o volume dela', () => {
    const menu = new SoundMenu(DEFAULT_VOLUMES)
    menu.select(1)
    expect(menu.key).toBe('music')
    menu.adjust(-2)
    expect(menu.volumes).toEqual({ ...DEFAULT_VOLUMES, music: DEFAULT_VOLUMES.music - 2 })
  })

  it('não passa da primeira nem da última linha', () => {
    const menu = new SoundMenu(DEFAULT_VOLUMES)
    menu.select(-1)
    expect(menu.key).toBe('master')
    menu.select(10)
    expect(menu.key).toBe('effects')
  })
})
