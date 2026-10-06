import { ATTACKS, attackPoint } from '../sim/attacks'
import type { Tell } from '../bots/controller'
import type { Fighter } from '../sim/types'

export interface Vec {
  x: number
  y: number
}

export interface Skeleton {
  head: Vec
  neck: Vec
  hip: Vec
  elbowFront: Vec
  handFront: Vec
  elbowBack: Vec
  handBack: Vec
  kneeFront: Vec
  footFront: Vec
  kneeBack: Vec
  footBack: Vec
}

export type Joint = keyof Skeleton

export const BONES: [Joint, Joint][] = [
  ['head', 'neck'],
  ['neck', 'hip'],
  ['neck', 'elbowFront'],
  ['elbowFront', 'handFront'],
  ['neck', 'elbowBack'],
  ['elbowBack', 'handBack'],
  ['hip', 'kneeFront'],
  ['kneeFront', 'footFront'],
  ['hip', 'kneeBack'],
  ['kneeBack', 'footBack'],
]

export const HEAD_RADIUS = 12
const UPPER_ARM = 27
const FOREARM = 27
const THIGH = 33
const SHIN = 33

// A pose é só visual: o simulador decide o que acontece, aqui só se escolhe como aparece.
// tell é o aviso do bot (braço puxado, perna levantada, agachadinha antes do pulo, cansaço).
export function poseFighter(f: Fighter, tick: number, tell: Tell = null): Skeleton {
  const d = f.facing
  const kind = f.attack?.kind
  const ext = attackExtension(f)
  const hurt = f.hitStun > 0
  const telling = f.onGround && !f.attack && !hurt && !f.blocking ? tell : null

  let hipY = f.y - 60
  let neckY = f.y - 110
  if (f.crouching) {
    hipY = f.y - 38
    neckY = f.y - 82
  } else if (!f.onGround) {
    hipY = f.y - 66
    neckY = f.y - 114
  }
  if (telling === 'jump') {
    hipY = f.y - 44
    neckY = f.y - 92
  } else if (telling === 'tired') {
    neckY += 10 + Math.sin(tick * 0.25) * 3
  }

  let lean = 0
  if (hurt) lean = -d * 12
  else if (kind === 'kick') lean = -d * 14 * ext
  else if (kind === 'punch') lean = d * 8 * ext
  else if (telling === 'punch' || telling === 'kick') lean = -d * 7
  else if (telling === 'tired') lean = d * 8

  const idle = f.onGround && !f.attack && !hurt && Math.abs(f.vx) < 0.1
  if (idle) neckY += Math.sin(tick * 0.07) * 1.5

  const hip = { x: f.x - lean * 0.3, y: hipY }
  const neck = { x: f.x + lean + d * 3, y: neckY }
  const head = { x: neck.x + d * 3 + lean * 0.2, y: neck.y - HEAD_RADIUS - 4 }
  const shoulder = { x: neck.x, y: neck.y + 6 }

  // Braços: guarda perto do rosto.
  let handFront = { x: shoulder.x + d * 24, y: shoulder.y - 10 }
  let handBack = { x: shoulder.x + d * 14, y: shoulder.y + 2 }
  if (f.blocking) {
    handFront = { x: shoulder.x + d * 18, y: shoulder.y - 22 }
    handBack = { x: shoulder.x + d * 16, y: shoulder.y - 8 }
  } else if (hurt) {
    handFront = { x: shoulder.x - d * 10, y: shoulder.y + 24 }
    handBack = { x: shoulder.x - d * 24, y: shoulder.y + 10 }
  } else if (!f.onGround) {
    handFront = { x: shoulder.x + d * 22, y: shoulder.y - 20 }
    handBack = { x: shoulder.x - d * 18, y: shoulder.y - 12 }
  }
  if (telling === 'punch') {
    handFront = { x: shoulder.x - d * 14, y: shoulder.y - 2 }
  } else if (telling === 'tired') {
    handFront = { x: shoulder.x + d * 8, y: shoulder.y + 48 }
    handBack = { x: shoulder.x - d * 4, y: shoulder.y + 48 }
  }
  if (kind === 'punch') handFront = lerp(handFront, attackPoint(f, 'punch'), ext)

  // Pernas: base parada, caminhada, pulo ou chute.
  const stance = f.crouching ? 20 : 12
  let footFront = { x: f.x + d * stance, y: f.y }
  let footBack = { x: f.x - d * stance, y: f.y }
  if (!f.onGround) {
    footFront = { x: hip.x + d * 14, y: hip.y + 44 }
    footBack = { x: hip.x - d * 8, y: hip.y + 50 }
  } else if (Math.abs(f.vx) > 0.1 && !f.attack && !hurt) {
    const phase = f.stride * 0.09
    footFront = { x: f.x + d * 12 + Math.sin(phase) * 14, y: f.y - Math.max(0, Math.cos(phase)) * 9 }
    footBack = { x: f.x - d * 12 - Math.sin(phase) * 14, y: f.y - Math.max(0, -Math.cos(phase)) * 9 }
  }
  if (telling === 'kick') footFront = { x: f.x + d * 10, y: f.y - 28 }
  if (kind === 'kick') footFront = lerp(footFront, attackPoint(f, 'kick'), ext)

  const [elbowFront, handFrontReached] = ik(shoulder, handFront, UPPER_ARM, FOREARM, d)
  const [elbowBack, handBackReached] = ik(shoulder, handBack, UPPER_ARM, FOREARM, d)
  const [kneeFront, footFrontReached] = ik(hip, footFront, THIGH, SHIN, -d)
  const [kneeBack, footBackReached] = ik(hip, footBack, THIGH, SHIN, -d)

  return {
    head,
    neck,
    hip,
    elbowFront,
    handFront: handFrontReached,
    elbowBack,
    handBack: handBackReached,
    kneeFront,
    footFront: footFrontReached,
    kneeBack,
    footBack: footBackReached,
  }
}

// 0 = recolhido, 1 = golpe totalmente esticado.
function attackExtension(f: Fighter): number {
  const a = f.attack
  if (!a) return 0
  const s = ATTACKS[a.kind]
  if (a.tick < s.startup) return easeOut(a.tick / s.startup)
  if (a.tick < s.startup + s.active) return 1
  return 1 - (a.tick - s.startup - s.active) / s.recovery
}

// IK de dois ossos: devolve [articulação do meio, ponta]. bend escolhe o lado da dobra.
function ik(root: Vec, target: Vec, l1: number, l2: number, bend: number): [Vec, Vec] {
  const dx = target.x - root.x
  const dy = target.y - root.y
  const dist = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.001), l1 + l2 - 0.001)
  const angle = Math.atan2(dy, dx)
  const cos = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist)
  const a1 = angle + bend * Math.acos(Math.min(1, Math.max(-1, cos)))
  const joint = { x: root.x + Math.cos(a1) * l1, y: root.y + Math.sin(a1) * l1 }
  const end = { x: root.x + Math.cos(angle) * dist, y: root.y + Math.sin(angle) * dist }
  return [joint, end]
}

function lerp(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}
