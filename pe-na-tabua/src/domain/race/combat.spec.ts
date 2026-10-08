import { describe, expect, it } from 'vitest'
import { ATTACKS } from './attacks'
import { startAttack, stepAttack } from './combat'
import { MAX_HEALTH } from './constants'
import { testRider } from './test-riders'
import type { Rider } from './types'

function punch(attacker: Rider, riders: Rider[]) {
  startAttack(attacker, 'punch', riders)
  return stepAttack(attacker, riders, ATTACKS.punch.impactAt + 0.01)
}

describe('combate', () => {
  it('soco acerta quem está ao lado e dentro do alcance', () => {
    const attacker = testRider(0)
    const target = testRider(1, { x: 1.2 })
    const events = punch(attacker, [attacker, target])
    expect(target.health).toBe(MAX_HEALTH - ATTACKS.punch.damage)
    expect(target.pushVel).toBeGreaterThan(0)
    expect(events).toEqual([{ kind: 'hit', attackerId: 0, targetId: 1, attack: 'punch' }])
  })

  it('mira o lado em que o alvo está', () => {
    const attacker = testRider(0)
    const target = testRider(1, { x: -1.2 })
    startAttack(attacker, 'punch', [attacker, target])
    expect(attacker.attack?.side).toBe(-1)
  })

  it('fora do alcance não acerta', () => {
    const attacker = testRider(0)
    const target = testRider(1, { x: 3 })
    expect(punch(attacker, [attacker, target])).toEqual([])
    expect(target.health).toBe(MAX_HEALTH)
  })

  it('zerar a vida derruba o alvo', () => {
    const attacker = testRider(0)
    const target = testRider(1, { x: 1, health: 5 })
    const events = punch(attacker, [attacker, target])
    expect(target.crashTimer).toBeGreaterThan(0)
    expect(events[0]).toMatchObject({ kind: 'knockout', targetId: 1 })
  })

  it('não começa outro golpe durante o cooldown', () => {
    const attacker = testRider(0)
    punch(attacker, [attacker])
    stepAttack(attacker, [attacker], 1)
    expect(attacker.cooldown).toBeGreaterThan(0)
    startAttack(attacker, 'punch', [attacker])
    expect(attacker.attack).toBeNull()
  })
})
