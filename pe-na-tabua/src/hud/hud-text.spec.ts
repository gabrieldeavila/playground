import { describe, expect, it } from 'vitest'
import { createRace } from '../domain/race/create-race'
import { ROSTER } from '../domain/race/roster'
import { SERRA } from '../domain/track/courses/serra'
import { createTrack } from '../domain/track/create-track'
import { copWarningText } from './cop-warning'
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

  it('diz em que o jogador bateu', () => {
    expect(describeEvent({ kind: 'crash', riderId: me, car: 'taxi' }, race)).toBe('HIT A TAXI!')
    expect(describeEvent({ kind: 'crash', riderId: me, car: null }, race)).toBe('WIPEOUT!')
    expect(describeEvent({ kind: 'crash', riderId: 0, car: 'sedan' }, race)).toBeNull()
  })

  it('atropelar: devagar só um susto, rápido cai junto e machuca', () => {
    expect(describeEvent({ kind: 'pedestrian', riderId: me, crashed: false }, race)).toBe('OI! WATCH IT!')
    expect(describeEvent({ kind: 'pedestrian', riderId: me, crashed: true }, race)).toBe('PEDESTRIAN! WIPEOUT!')
    expect(describeEvent({ kind: 'pedestrian', riderId: 0, crashed: true }, race)).toBeNull()
    expect(hurtsPlayer({ kind: 'pedestrian', riderId: me, crashed: true }, race)).toBe(true)
    expect(hurtsPlayer({ kind: 'pedestrian', riderId: me, crashed: false }, race)).toBe(false)
  })

  it('cones e buracos só aparecem para o jogador', () => {
    expect(describeEvent({ kind: 'cone', riderId: me }, race)).toBe('CONES!')
    expect(describeEvent({ kind: 'pothole', riderId: me }, race)).toBe('POTHOLE!')
    expect(describeEvent({ kind: 'pothole', riderId: 0 }, race)).toBeNull()
  })

  it('anuncia golpes de arma e armas tomadas', () => {
    expect(describeEvent({ kind: 'hit', attackerId: me, targetId: 0, attack: 'club' }, race)).toBe('WHACK!')
    expect(describeEvent({ kind: 'disarm', attackerId: me, targetId: 0, weapon: 'chain' }, race)).toBe('GOT A CHAIN!')
    expect(describeEvent({ kind: 'disarm', attackerId: 0, targetId: me, weapon: 'club' }, race)).toBe('LOST YOUR CLUB!')
    expect(describeEvent({ kind: 'disarm', attackerId: 0, targetId: 1, weapon: 'club' }, race)).toBeNull()
  })

  it('aviso da polícia mostra de que lado e a que distância', () => {
    expect(copWarningText(84.6)).toBe('POLICE ▲ 85 M')
    expect(copWarningText(-40)).toBe('POLICE ▼ 40 M')
  })

  it('avisa da polícia e da prisão', () => {
    expect(describeEvent({ kind: 'chase', copId: 0 }, race)).toBe('POLICE!')
    expect(describeEvent({ kind: 'busted', copId: 0 }, race)).toBe('BUSTED!')
  })

  it('golpe recebido machuca o jogador', () => {
    expect(hurtsPlayer({ kind: 'hit', attackerId: 0, targetId: me, attack: 'punch' }, race)).toBe(true)
    expect(hurtsPlayer({ kind: 'hit', attackerId: me, targetId: 0, attack: 'punch' }, race)).toBe(false)
  })
})
