import { standings } from './domain/race/standings'
import { SERRA } from './domain/track/courses/serra'
import { createTrack } from './domain/track/create-track'
import { CameraDirector } from './game/camera-director'
import { startLoop } from './game/fixed-loop'
import { RidersView } from './game/riders-view'
import { Session } from './game/session'
import { buildWorld, followCamera } from './game/world-view'
import { Hud } from './hud/hud'
import { Screens } from './hud/screens'
import { Keyboard } from './input/keyboard'
import { Cockpit } from './render/cockpit/cockpit'
import { PLAYER_COLORS } from './render/rider-colors'
import { createStage, followSun } from './render/stage'

const stage = createStage(document.getElementById('game') as HTMLCanvasElement)
const track = createTrack(SERRA)
const world = buildWorld(stage.scene, track, stage.renderer.capabilities.getMaxAnisotropy())
const session = new Session(track)
const riders = new RidersView(stage.scene, session.race.riders)
const director = new CameraDirector(stage.camera, riders)
const cockpit = new Cockpit(stage.renderer, PLAYER_COLORS)
const keyboard = new Keyboard(window)
const hud = new Hud()
const screens = new Screens(document.getElementById('screen')!)
let resultsShown = false

screens.showTitle()
hud.setVisible(false)

function startRace(): void {
  session.start()
  director.reset()
  hud.reset(session.race)
  hud.setVisible(true)
  screens.hide()
  resultsShown = false
}

function handleKey(code: string): void {
  const confirm = code === 'Enter' || code === 'Space'
  if (confirm && session.mode !== 'racing') startRace()
  else if (code === 'KeyR' && session.mode === 'racing') startRace()
  else if (code === 'KeyC') director.toggle()
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
  const player = race.riders[race.playerId]
  riders.update(race)
  director.update(race, dt)
  followCamera(world, stage.camera)
  followSun(stage.sun, riders.positionOf(race.playerId))
  if (session.mode === 'racing') {
    hud.update(race, dt)
    hud.setSpeedPanelVisible(!director.showsCockpit)
  }
  stage.renderer.render(stage.scene, stage.camera)
  if (director.showsCockpit) {
    cockpit.update(player, dt, race.time)
    cockpit.render(stage.renderer)
  }
}

startLoop(step, frame)
