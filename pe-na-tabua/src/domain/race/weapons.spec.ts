import { describe, expect, it } from 'vitest'
import { ATTACKS, attackFor } from './attacks'
import { startAttack, stepAttack } from './combat'
import { MAX_HEALTH } from './constants'
import { knockOff } from './crash'
import { testRider } from './test-riders'
import type { Move, Rider } from './types'

function swing(attacker: Rider, riders: Rider[], move: Move = 'punch') {
  startAttack(attacker, move, riders)
  return stepAttack(attacker, riders, ATTACKS[attacker.attack!.kind].impactAt + 0.01)
}

describe('armas', () => {
  it('armado, o soco vira golpe de arma; o chute continua chute', () => {
    const armed = testRider(0, { weapon: 'chain' })
    expect(attackFor(armed, 'punch')).toBe('chain')
    expect(attackFor(armed, 'kick')).toBe('kick')
    expect(attackFor(testRider(1), 'punch')).toBe('punch')
  })

  it('a corrente alcança quem o soco não alcança e machuca mais', () => {
    const attacker = testRider(0, { weapon: 'chain' })
    const target = testRider(1, { x: 2.6 })
    const events = swing(attacker, [attacker, target])
    expect(events).toEqual([{ kind: 'hit', attackerId: 0, targetId: 1, attack: 'chain' }])
    expect(target.health).toBe(MAX_HEALTH - ATTACKS.chain.damage)
    expect(ATTACKS.club.damage).toBeGreaterThan(ATTACKS.punch.damage)
  })

  it('soco de mão vazia toma a arma de quem está armado', () => {
    const attacker = testRider(0)
    const target = testRider(1, { x: 1.2, weapon: 'club' })
    const events = swing(attacker, [attacker, target])
    expect(attacker.weapon).toBe('club')
    expect(target.weapon).toBeNull()
    expect(events).toContainEqual({ kind: 'disarm', attackerId: 0, targetId: 1, weapon: 'club' })
  })

  it('quem já está armado não toma outra arma, e chute não desarma', () => {
    const armed = testRider(0, { weapon: 'chain' })
    const target = testRider(1, { x: 1.2, weapon: 'club' })
    swing(armed, [armed, target])
    expect(target.weapon).toBe('club')

    const kicker = testRider(2)
    const other = testRider(3, { x: 1.2, weapon: 'club' })
    swing(kicker, [kicker, other], 'kick')
    expect(other.weapon).toBe('club')
  })

  it('nocaute de mão vazia num armado ainda pega a arma', () => {
    const attacker = testRider(0)
    const target = testRider(1, { x: 1.2, weapon: 'chain', health: 5 })
    const events = swing(attacker, [attacker, target])
    expect(attacker.weapon).toBe('chain')
    expect(events.map((e) => e.kind)).toEqual(['knockout', 'disarm'])
  })

  it('cair da moto perde a arma', () => {
    const rider = testRider(0, { weapon: 'club' })
    knockOff(rider, 1)
    expect(rider.weapon).toBeNull()
  })
})
