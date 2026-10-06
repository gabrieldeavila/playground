import { ATTACKS, attackDamage, attackDuration, attackPoint, isActive } from './attacks'
import {
  ARENA_WIDTH,
  BLOCK_DAMAGE_FACTOR,
  BODY_HALF_WIDTH,
  CROUCH_HEIGHT,
  FLOOR_Y,
  GRAVITY,
  GROUND_FRICTION,
  HIT_STOP_TICKS,
  JUMP_VELOCITY,
  MAX_HP,
  MIN_SEPARATION,
  ROUND_TICKS,
  STAND_HEIGHT,
  WALK_SPEED,
  WALL_MARGIN,
} from './constants'
import { EMPTY_INPUT } from './types'
import type { Attack, Fighter, HitEvent, Input, PlayerIndex, World } from './types'

// Simulação pura e determinística: nada de DOM, Math.random ou relógio.
// A mesma função roda na tela e (depois) no treino da IA.

export function createFighter(x: number, facing: 1 | -1): Fighter {
  return {
    x,
    y: FLOOR_Y,
    vx: 0,
    vy: 0,
    facing,
    hp: MAX_HP,
    onGround: true,
    crouching: false,
    blocking: false,
    attack: null,
    hitStun: 0,
    blockStun: 0,
    stride: 0,
    ko: false,
  }
}

export function createWorld(startX: [number, number] = [ARENA_WIDTH * 0.3, ARENA_WIDTH * 0.7]): World {
  const [x0, x1] = startX
  return {
    tick: 0,
    fighters: [createFighter(x0, x1 >= x0 ? 1 : -1), createFighter(x1, x1 >= x0 ? -1 : 1)],
    phase: 'fight',
    winner: null,
    roundTicksLeft: ROUND_TICKS,
    hitStop: 0,
    events: [],
  }
}

export function step(world: World, inputs: [Input, Input]): void {
  world.events.length = 0

  if (world.phase === 'over') {
    world.tick++
    for (const f of world.fighters) updateFighter(f, EMPTY_INPUT, null)
    return
  }

  if (world.hitStop > 0) {
    world.hitStop--
    return
  }

  world.tick++
  world.roundTicksLeft--

  const [a, b] = world.fighters
  updateFighter(a, inputs[0], b)
  updateFighter(b, inputs[1], a)

  // Calcula os acertos dos dois antes de aplicar, para trocas simultâneas serem justas.
  const hits = [findHit(a, b, 0), findHit(b, a, 1)].filter((h) => h !== null)
  for (const hit of hits) applyHit(world, hit)

  separate(a, b)
  checkRoundEnd(world)
}

function updateFighter(f: Fighter, input: Input, opponent: Fighter | null): void {
  if (f.hitStun > 0) f.hitStun--
  if (f.blockStun > 0) f.blockStun--
  const stunned = f.hitStun > 0 || f.blockStun > 0 || f.ko

  if (f.attack) {
    f.attack.tick++
    if (f.attack.tick >= attackDuration(ATTACKS[f.attack.kind])) f.attack = null
  }

  const busy = stunned || f.attack !== null

  if (!busy) {
    f.crouching = f.onGround && input.crouch
    f.blocking = f.onGround && !f.crouching && input.block
  } else if (stunned) {
    f.blocking = f.blockStun > 0
  }

  if (f.onGround && !busy) {
    if (opponent && opponent.x !== f.x) f.facing = opponent.x > f.x ? 1 : -1

    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    if (input.jump && !f.crouching && !f.blocking) {
      f.vy = JUMP_VELOCITY
      f.vx = dir * WALK_SPEED
      f.onGround = false
    } else if (f.crouching || f.blocking) {
      f.vx = 0
    } else {
      f.vx = dir * WALK_SPEED
    }
  }

  if (!stunned && !f.attack && !f.blocking && (input.punch || input.kick)) {
    f.attack = { kind: input.punch ? 'punch' : 'kick', tick: 0, hasHit: false }
  }

  if (!f.onGround) f.vy += GRAVITY
  // Atacando ou atordoado no chão: desliza até parar.
  if (f.onGround && (stunned || f.attack)) f.vx *= GROUND_FRICTION

  f.x += f.vx
  f.y += f.vy
  if (f.y >= FLOOR_Y) {
    f.y = FLOOR_Y
    f.vy = 0
    f.onGround = true
  }
  f.x = clampToArena(f.x)

  if (f.onGround) f.stride += Math.abs(f.vx)
}

interface PendingHit extends HitEvent {
  defender: Fighter
  attackerFighter: Fighter
  // Guardados à parte: numa troca, o atacante pode levar o golpe do outro (e mudar de estado)
  // antes deste acerto ser aplicado.
  attack: Attack
  damage: number
}

function findHit(attacker: Fighter, defender: Fighter, index: PlayerIndex): PendingHit | null {
  const attack = attacker.attack
  if (!attack || attack.hasHit) return null
  const spec = ATTACKS[attack.kind]
  if (!isActive(spec, attack.tick)) return null

  const { x, y } = attackPoint(attacker, attack.kind)
  if (!inHurtbox(defender, x, y)) return null

  const blocked = defender.blocking && defender.facing === -attacker.facing
  const damage = attackDamage(attacker, attack.kind)
  return { attacker: index, kind: attack.kind, x, y, blocked, defender, attackerFighter: attacker, attack, damage }
}

function inHurtbox(f: Fighter, x: number, y: number): boolean {
  const height = f.crouching ? CROUCH_HEIGHT : STAND_HEIGHT
  const tolerance = 8
  return Math.abs(x - f.x) <= BODY_HALF_WIDTH + tolerance && y <= f.y + tolerance && y >= f.y - height
}

function applyHit(world: World, hit: PendingHit): void {
  const { defender, attackerFighter } = hit
  const spec = ATTACKS[hit.kind]
  hit.attack.hasHit = true

  if (hit.blocked) {
    defender.hp -= Math.round(hit.damage * BLOCK_DAMAGE_FACTOR)
    defender.blockStun = spec.blockStun
    defender.vx = attackerFighter.facing * spec.knockback * 0.6
    world.hitStop = Math.max(world.hitStop, 2)
  } else {
    defender.hp -= hit.damage
    defender.hitStun = spec.hitStun
    defender.attack = null
    defender.blocking = false
    defender.crouching = false
    defender.vx = attackerFighter.facing * spec.knockback
    if (!defender.onGround) defender.vy = Math.min(defender.vy, -3)
    world.hitStop = Math.max(world.hitStop, HIT_STOP_TICKS)
  }
  defender.hp = Math.max(0, defender.hp)

  world.events.push({ attacker: hit.attacker, kind: hit.kind, x: hit.x, y: hit.y, blocked: hit.blocked })
}

function separate(a: Fighter, b: Fighter): void {
  if (Math.abs(a.y - b.y) > STAND_HEIGHT * 0.7) return
  const dx = b.x - a.x
  const overlap = MIN_SEPARATION - Math.abs(dx)
  if (overlap <= 0) return
  const dir = dx !== 0 ? Math.sign(dx) : a.facing
  a.x = clampToArena(a.x - (dir * overlap) / 2)
  b.x = clampToArena(b.x + (dir * overlap) / 2)
}

function clampToArena(x: number): number {
  return Math.min(ARENA_WIDTH - WALL_MARGIN, Math.max(WALL_MARGIN, x))
}

function checkRoundEnd(world: World): void {
  const [a, b] = world.fighters
  const aDown = a.hp <= 0
  const bDown = b.hp <= 0

  if (aDown || bDown) {
    a.ko = aDown
    b.ko = bDown
    world.winner = aDown && bDown ? null : aDown ? 1 : 0
  } else if (world.roundTicksLeft <= 0) {
    world.winner = a.hp === b.hp ? null : a.hp > b.hp ? 0 : 1
  } else {
    return
  }

  world.phase = 'over'
  for (const f of world.fighters) {
    f.attack = null
    f.blocking = false
    f.crouching = false
  }
}
