import { standings } from './domain/race/standings'
import { SERRA } from './domain/track/courses/serra'
import { createTrack } from './domain/track/create-track'
import { startLoop } from './game/fixed-loop'
import { RidersView } from './game/riders-view'
import { Session } from './game/session'
import { buildWorld, followCamera } from './game/world-view'
import { Hud } from './hud/hud'
import { Screens } from './hud/screens'
import { Keyboard } from './input/keyboard'
import { ChaseCamera } from './render/chase-camera'
import { createStage, followSun } from './render/stage'

const stage = createStage(document.getElementById('game') as HTMLCanvasElement)
const track = createTrack(SERRA)
const world = buildWorld(stage.scene, track, stage.renderer.capabilities.getMaxAnisotropy())
const session = new Session(track)
const riders = new RidersView(stage.scene, session.race.riders)
const chase = new ChaseCamera(stage.camera)
const keyboard = new Keyboard(window)
const hud = new Hud()
const screens = new Screens(document.getElementById('screen')!)
let resultsShown = false

screens.showTitle()
hud.setVisible(false)

function startRace(): void {
  session.start()
  chase.reset()
  hud.reset(session.race)
  hud.setVisible(true)
  screens.hide()
  resultsShown = false
}

function handleKey(code: string): void {
  const confirm = code === 'Enter' || code === 'Space'
  if (confirm && session.mode !== 'racing') startRace()
  else if (code === 'KeyR' && session.mode === 'racing') startRace()
}

function step(dt: number): void {
  for (const code of keyboard.takePresses()) handleKey(code)
  for (const event of session.step(keyboard.read(), dt)) hud.onEvent(event, session.race)
  if (session.mode === 'results' && !resultsShown) {
    resultsShown = true
    hud.setVisible(false)
    screens.showResults(standings(session.race), session.race.playerId)
  }
}

function frame(dt: number): void {
  const race = session.race
  riders.update(race)
  chase.update(race.riders[race.playerId], track, dt)
  followCamera(world, stage.camera)
  followSun(stage.sun, riders.positionOf(race.playerId))
  if (session.mode === 'racing') hud.update(race, dt)
  stage.renderer.render(stage.scene, stage.camera)
}

startLoop(step, frame)
