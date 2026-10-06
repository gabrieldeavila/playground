import type { Controller, Tell } from './bots/controller'
import { Match } from './campaign/match'
import { isUnlocked, loadProgress, saveProgress } from './campaign/progress'
import { STAGES } from './campaign/stages'
import { Keyboard } from './input'
import { Renderer } from './render/renderer'
import { drawIntro, drawMap, drawResult } from './render/screens'
import { PLAYER_LOOK } from './render/stickman'
import { ARENA_HEIGHT, ARENA_WIDTH, TICK_RATE } from './sim/constants'

type Screen =
  | { kind: 'map' }
  | { kind: 'intro'; index: number }
  | {
      kind: 'fight'
      index: number
      match: Match
      paused: boolean
      // Preenchido quando a luta acaba e o progresso já foi salvo.
      outcome: { unlockedNext: boolean; firstLoss: boolean } | null
    }

const canvas = document.getElementById('game') as HTMLCanvasElement
const dpr = Math.min(window.devicePixelRatio || 1, 2)
canvas.width = ARENA_WIDTH * dpr
canvas.height = ARENA_HEIGHT * dpr
const ctx = canvas.getContext('2d')!
ctx.scale(dpr, dpr)

const keyboard = new Keyboard(window)
const renderer = new Renderer(ctx)
const player: Controller = { read: () => keyboard.read() }
const progress = loadProgress()

let screen: Screen = { kind: 'map' }
// Começa no andar mais alto liberado.
let selected = STAGES.reduce((top, _, i) => (isUnlocked(progress, i) ? i : top), 0)
// Ticks desde que a tela atual abriu (para animações dos menus).
let screenTicks = 0

function show(next: Screen): void {
  screen = next
  screenTicks = 0
}

function startFight(index: number): void {
  const stage = STAGES[index]
  const match = new Match(stage, player)
  match.onRoundStart = () => renderer.reset()
  renderer.reset()
  renderer.setup = { names: ['VOCÊ', stage.name.toUpperCase()], looks: [PLAYER_LOOK, stage.look], arena: stage.arena }
  show({ kind: 'fight', index, match, paused: false, outcome: null })
}

function handleKey(key: string): void {
  switch (screen.kind) {
    case 'map':
      if (key === 'ArrowUp' || key === 'KeyW') selected = Math.min(selected + 1, STAGES.length - 1)
      else if (key === 'ArrowDown' || key === 'KeyS') selected = Math.max(selected - 1, 0)
      else if ((key === 'Enter' || key === 'Space') && isUnlocked(progress, selected)) show({ kind: 'intro', index: selected })
      break
    case 'intro':
      if (key === 'Enter' || key === 'Space') startFight(screen.index)
      else if (key === 'Escape') show({ kind: 'map' })
      break
    case 'fight':
      if (screen.outcome) {
        if (key === 'Enter') {
          if (screen.match.result?.won && isUnlocked(progress, screen.index + 1)) selected = screen.index + 1
          show({ kind: 'map' })
        } else if (key === 'KeyR') {
          startFight(screen.index)
        }
      } else if (screen.paused) {
        if (key === 'Enter') screen.paused = false
        else if (key === 'Escape') show({ kind: 'map' })
      } else if (key === 'Escape') {
        screen.paused = true
      }
      break
  }
}

// Salva estrelas/derrota e devolve o que a tela de resultado precisa contar.
function recordOutcome(index: number, match: Match): { unlockedNext: boolean; firstLoss: boolean } {
  const stage = STAGES[index]
  const result = match.result!
  const hasNext = index + 1 < STAGES.length
  const nextWasUnlocked = hasNext && isUnlocked(progress, index + 1)
  const losses = progress.losses[stage.id] ?? 0
  if (result.won) progress.stars[stage.id] = Math.max(progress.stars[stage.id] ?? 0, result.stars)
  else progress.losses[stage.id] = losses + 1
  saveProgress(progress)
  return { unlockedNext: result.won && hasNext && !nextWasUnlocked, firstLoss: !result.won && losses === 0 }
}

function update(): void {
  screenTicks++
  if (screen.kind !== 'fight' || screen.paused) return
  const { match } = screen
  if (match.update()) {
    const tells: [Tell, Tell] = [null, match.bot.tell ?? null]
    renderer.onStep(match.world, tells)
  }
  if (match.result && !screen.outcome) {
    screen.outcome = recordOutcome(screen.index, match)
    screenTicks = 0
  }
}

function draw(): void {
  switch (screen.kind) {
    case 'map':
      drawMap(ctx, progress, selected, screenTicks)
      break
    case 'intro': {
      const stage = STAGES[screen.index]
      drawIntro(ctx, stage, screen.index, (progress.losses[stage.id] ?? 0) > 0, screenTicks)
      break
    }
    case 'fight': {
      const { match } = screen
      renderer.draw(match.world, {
        tells: [null, match.bot.tell ?? null],
        wins: match.wins,
        banner: match.banner,
        paused: screen.paused,
        matchOver: screen.outcome !== null,
      })
      if (screen.outcome && match.result) drawResult(ctx, match.stage, match.result, screen.outcome, screenTicks)
      break
    }
  }
}

// Passo fixo: a simulação sempre roda a 60 ticks/s, independente do monitor.
const STEP_MS = 1000 / TICK_RATE
let accumulator = 0
let last = performance.now()

function frame(now: number): void {
  accumulator += Math.min(now - last, 250)
  last = now

  for (const key of keyboard.takePresses()) handleKey(key)
  while (accumulator >= STEP_MS) {
    update()
    accumulator -= STEP_MS
  }
  draw()
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
