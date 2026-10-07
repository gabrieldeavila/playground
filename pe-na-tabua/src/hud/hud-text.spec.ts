import { describe, expect, it } from 'vitest'
import { createRace } from '../domain/race/create-race'
import { ROSTER } from '../domain/race/roster'
import { SERRA } from '../domain/track/courses/serra'
import { createTrack } from '../domain/track/create-track'
import { describeEvent, hurtsPlayer } from './describe-event'
import { formatTime, ordinal } from './format-time'

describe('formatTime', () => {
  it('formata minutos, segundos e décimos', () => {
    expect(formatTime(83.456)).toBe('1:23.4')
    expect(formatTime(5)).toBe('0:05.0')
  })
})

describe('ordinal', () => {
  it('usa o sufixo certo em inglês', () => {
    expect([1, 2, 3, 4, 11, 12, 21].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '21st'])
  })
})

describe('describeEvent', () => {
  const race = createRace(createTrack(SERRA), ROSTER, 1)
  const me = race.playerId

  it('anuncia os golpes do jogador e ignora os dos outros', () => {
    expect(describeEvent({ kind: 'hit', attackerId: me, targetId: 0, attack: 'kick' }, race)).toBe('KICK!')
    expect(describeEvent({ kind: 'hit', attackerId: 0, targetId: 1, attack: 'punch' }, race)).toBeNull()
  })

  it('anuncia quem o jogador derrubou e quando ele cai', () => {
    expect(describeEvent({ kind: 'knockout', attackerId: me, targetId: 0 }, race)).toBe('VIPER IS DOWN!')
    expect(describeEvent({ kind: 'knockout', attackerId: 0, targetId: me }, race)).toBe('KNOCKED OFF!')
  })

  it('golpe recebido machuca o jogador', () => {
    expect(hurtsPlayer({ kind: 'hit', attackerId: 0, targetId: me, attack: 'punch' }, race)).toBe(true)
    expect(hurtsPlayer({ kind: 'hit', attackerId: me, targetId: 0, attack: 'punch' }, race)).toBe(false)
  })
})
