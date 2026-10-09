import { describe, expect, it } from 'vitest'
import { NEW_CAREER } from '../domain/career/career'
import { NEW_SAVE, parseSave } from './parse-save'

const career = { level: 3, cleared: ['Serra'], champion: false }

describe('parseSave', () => {
  it('lê o que foi salvo', () => {
    const save = { difficulty: 'outlaw', careers: { joyride: NEW_CAREER, racer: career, outlaw: { ...career, champion: true } } }
    expect(parseSave(JSON.stringify(save), 5)).toEqual(save)
  })

  it('sem nada salvo, ou com lixo, começa do zero', () => {
    for (const text of [null, '', '{', 'null', '42', '[]']) expect(parseSave(text, 5)).toEqual(NEW_SAVE)
  })

  it('uma carreira quebrada volta do zero sem apagar as outras', () => {
    const save = { difficulty: 'racer', careers: { racer: career, outlaw: { level: '2', cleared: [], champion: false }, joyride: { ...career, cleared: [1] } } }
    const parsed = parseSave(JSON.stringify(save), 5)
    expect(parsed.careers).toEqual({ joyride: NEW_CAREER, racer: career, outlaw: NEW_CAREER })
  })

  it('modo desconhecido ou nível que não existe mais voltam para o padrão', () => {
    const save = { difficulty: 'nightmare', careers: { racer: { ...career, level: 7 } } }
    expect(parseSave(JSON.stringify(save), 5)).toEqual(NEW_SAVE)
  })
})
