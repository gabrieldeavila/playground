import { RaceAudio } from './audio/race-audio'
import { loadSave, storeSave } from './data/career-storage'
import { DIFFICULTIES } from './domain/career/difficulty'
import { LEVELS } from './domain/career/levels'
import { COURSES } from './domain/track/courses/courses'
import { standings } from './domain/race/standings'
import type { Track } from './domain/track/types'
import { CameraDirector } from './game/camera-director'
import { startLoop } from './game/fixed-loop'
import { type Action, actionFor } from './game/key-actions'
import { RidersView } from './game/riders-view'
import { Session } from './game/session'
import { TrackScenery } from './game/track-scenery'
import { TrafficView } from './game/traffic-view'
import { WorldView } from './game/world-view'
import { Hud } from './hud/hud'
import { courseRows } from './hud/course-rows'
import { levelRows } from './hud/level-rows'
import { modeRows } from './hud/mode-rows'
import { Screens } from './hud/screens'
import { Keyboard } from './input/keyboard'
import { blurAmount, headAngles } from './render/camera/speed-feel'
import { Cockpit } from './render/cockpit/cockpit'
import { PostFx } from './render/post/post-fx'
import { PLAYER_COLORS } from './render/rider-colors'
import { createStage, followSun } from './render/stage'
import { THEMES } from './render/theme/themes'

const stage = createStage(document.getElementById('game') as HTMLCanvasElement)
const session = new Session(loadSave())
const world = new WorldView(stage, THEMES[session.race.track.theme])
const scenery = new TrackScenery(stage.scene, stage.renderer.capabilities.getMaxAnisotropy())
showTrack(session.race.track)
const riders = new RidersView(stage.scene, session.race.riders)
const traffic = new TrafficView(stage.scene)
const director = new CameraDirector(stage.camera, riders)
const cockpit = new Cockpit(stage.renderer, PLAYER_COLORS)
const postFx = new PostFx(stage.renderer, stage.scene, stage.camera)
const audio = new RaceAudio()
const keyboard = new Keyboard(window)
const hud = new Hud()
const screens = new Screens(document.getElementById('screen')!)
let resultsShown = false

window.addEventListener('keydown', () => audio.unlock())

showTitle()
hud.setVisible(false)

// Pista nova (outro nível ou outra estrada): troca o cenário e o tema em volta.
function showTrack(track: Track): void {
  scenery.show(track)
  world.setTheme(THEMES[track.theme])
}

function startRace(): void {
  session.start()
  showTrack(session.race.track)
  director.reset()
  audio.reset()
  hud.reset(session.race)
  hud.setVisible(true)
  screens.hide()
  resultsShown = false
}

function showTitle(): void {
  session.showTitle()
  screens.showTitle(session.careers.outlaw.champion)
}

function showModes(): void {
  session.openModes()
  screens.showModes(modeRows(DIFFICULTIES, session.careers, LEVELS.length), session.difficulty.id)
}

function showLevels(): void {
  session.openLevels()
  hud.setVisible(false)
  const rows = levelRows(session.career, LEVELS, COURSES.length, session.difficulty)
  screens.showLevels(rows, session.selected, session.difficulty.name, session.career.champion)
}

function showCourses(keepSelection = false): void {
  const course = session.course
  session.openCourses()
  if (keepSelection) session.course = course
  hud.setVisible(false)
  const rows = courseRows(session.career, LEVELS[session.selected - 1], COURSES)
  screens.showCourses(rows, session.course, session.difficulty.name, session.selected)
}

// Setas trocam o que a tela atual lista: modo, nível ou pista.
function moveSelection(delta: number): void {
  const mode = session.mode
  session.select(delta)
  if (mode === 'modes') showModes()
  else if (mode === 'courses') showCourses(true)
  else showLevels()
}

function apply(action: Action): void {
  switch (action) {
    case 'modes':
      storeSave(session.save)
      return showModes()
    case 'levels':
      storeSave(session.save)
      return showLevels()
    case 'courses':
      return showCourses()
    case 'title':
      return showTitle()
    case 'select-up':
    case 'select-down':
      return moveSelection(action === 'select-up' ? -1 : 1)
    case 'race':
    case 'restart':
    case 'continue':
      return startRace()
    case 'camera':
      return director.toggle()
    case 'mute':
      return audio.toggleMute()
  }
}

function step(dt: number): void {
  for (const code of keyboard.takePresses()) {
    const action = actionFor(code, session.mode)
    if (action) apply(action)
  }
  for (const event of session.step(keyboard.read(), dt)) {
    hud.onEvent(event, session.race)
    audio.onEvent(event, session.race)
  }
  if (session.mode === 'results' && !resultsShown) {
    resultsShown = true
    hud.setVisible(false)
    storeSave(session.save)
    screens.showResults(standings(session.race), session.race.playerId, session.race.phase === 'busted', session.verdict!)
  }
}

function frame(dt: number): void {
  const race = session.race
  const player = race.riders[race.playerId]
  riders.update(race)
  traffic.update(race)
  director.update(race, dt)
  world.follow(stage.camera)
  followSun(stage.sun, riders.positionOf(race.playerId), world.theme.sunDirection)
  if (session.mode === 'racing') {
    hud.update(race, dt)
    hud.setSpeedPanelVisible(!director.showsCockpit)
  }
  audio.update(race, keyboard.read().throttle, session.mode === 'racing')
  postFx.render(blurAmount(director.feel))
  if (director.showsCockpit) {
    cockpit.update(player, headAngles(director.feel, race.time), dt, race.time)
    cockpit.render(stage.renderer)
  }
}

startLoop(step, frame)
