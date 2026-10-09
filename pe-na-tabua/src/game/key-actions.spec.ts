import { describe, expect, it } from 'vitest'
import { actionFor } from './key-actions'

describe('actionFor', () => {
  it('título: Enter abre os modos', () => {
    expect(actionFor('Enter', 'title')).toBe('modes')
    expect(actionFor('KeyR', 'title')).toBeNull()
  })

  it('modos: setas escolhem, Enter vai para os níveis, Esc volta ao título', () => {
    expect(actionFor('ArrowDown', 'modes')).toBe('select-down')
    expect(actionFor('Enter', 'modes')).toBe('levels')
    expect(actionFor('Escape', 'modes')).toBe('title')
  })

  it('níveis: setas escolhem, Enter vai para as pistas, Esc volta aos modos', () => {
    expect(actionFor('ArrowUp', 'levels')).toBe('select-up')
    expect(actionFor('ArrowDown', 'levels')).toBe('select-down')
    expect(actionFor('Space', 'levels')).toBe('courses')
    expect(actionFor('Escape', 'levels')).toBe('modes')
  })

  it('pistas: Enter corre, Esc volta aos níveis', () => {
    expect(actionFor('ArrowDown', 'courses')).toBe('select-down')
    expect(actionFor('Enter', 'courses')).toBe('race')
    expect(actionFor('Escape', 'courses')).toBe('levels')
  })

  it('corrida: R recomeça, Esc desiste; as setas são do piloto', () => {
    expect(actionFor('KeyR', 'racing')).toBe('restart')
    expect(actionFor('Escape', 'racing')).toBe('courses')
    expect(actionFor('ArrowUp', 'racing')).toBeNull()
  })

  it('resultado: Enter segue, L ou Esc vão para os níveis', () => {
    expect(actionFor('Enter', 'results')).toBe('continue')
    expect(actionFor('KeyL', 'results')).toBe('levels')
  })

  it('câmera e som em qualquer tela', () => {
    expect(actionFor('KeyC', 'racing')).toBe('camera')
    expect(actionFor('KeyM', 'title')).toBe('mute')
  })
})
