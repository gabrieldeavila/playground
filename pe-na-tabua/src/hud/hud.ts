import { nearestOpponent } from '../domain/race/combat'
import { MAX_HEALTH } from '../domain/race/constants'
import { placeOf } from '../domain/race/standings'
import type { Race, RaceEvent } from '../domain/race/types'
import { describeEvent, hurtsPlayer } from './describe-event'
import { formatTime } from './format-time'

const MESSAGE_SECONDS = 1.4
const RIVAL_RANGE = 30

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

// Painel por cima do jogo. Só lê a corrida; não guarda estado de jogo.
export class Hud {
  private readonly root = byId('hud')
  private readonly place = byId('hud-place')
  private readonly time = byId('hud-time')
  private readonly speed = byId('hud-speed')
  private readonly speedPanel = byId('hud-speed-panel')
  private readonly health = byId('hud-health')
  private readonly weapon = byId('hud-weapon')
  private readonly rival = byId('hud-rival')
  private readonly rivalName = byId('hud-rival-name')
  private readonly rivalHealth = byId('hud-rival-health')
  private readonly progress = byId('hud-progress')
  private readonly message = byId('hud-message')
  private readonly hurt = byId('hud-hurt')
  private dots: HTMLElement[] = []
  private messageTimer = 0

  setVisible(visible: boolean): void {
    this.root.hidden = !visible
  }

  // Na primeira pessoa a velocidade já está no painel da moto.
  setSpeedPanelVisible(visible: boolean): void {
    this.speedPanel.hidden = !visible
  }

  reset(race: Race): void {
    this.progress.replaceChildren()
    this.dots = race.riders.map((rider) => {
      const dot = document.createElement('div')
      dot.className = rider.id === race.playerId ? 'dot me' : 'dot'
      this.progress.append(dot)
      return dot
    })
    this.messageTimer = 0
  }

  onEvent(event: RaceEvent, race: Race): void {
    const text = describeEvent(event, race)
    if (text) this.flash(text)
    if (hurtsPlayer(event, race)) this.hurt.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: 400 })
  }

  update(race: Race, dt: number): void {
    const player = race.riders[race.playerId]
    this.place.textContent = `${placeOf(race, player.id)}/${race.riders.length}`
    this.time.textContent = formatTime(player.finishTime ?? race.time)
    this.speed.textContent = String(Math.round(player.speed * 3.6))
    this.health.style.width = `${(player.health / MAX_HEALTH) * 100}%`
    this.weapon.textContent = player.weapon ? `· ${player.weapon}` : ''
    this.updateRival(race)
    race.riders.forEach((rider, i) => (this.dots[i].style.left = `${Math.min(1, rider.s / race.track.finishS) * 100}%`))
    this.updateMessage(race, dt)
  }

  private updateRival(race: Race): void {
    const rival = nearestOpponent(race.riders[race.playerId], race.riders, RIVAL_RANGE)
    this.rival.style.visibility = rival ? 'visible' : 'hidden'
    if (!rival) return
    this.rivalName.textContent = rival.name.toUpperCase()
    this.rivalHealth.style.width = `${(rival.health / MAX_HEALTH) * 100}%`
  }

  private flash(text: string): void {
    this.message.textContent = text
    this.messageTimer = MESSAGE_SECONDS
  }

  // Contagem regressiva tem prioridade sobre as mensagens de evento.
  private updateMessage(race: Race, dt: number): void {
    if (race.phase === 'countdown') this.flash(String(Math.ceil(race.countdown)))
    else if (race.time < 0.8) this.flash('GO!')
    this.messageTimer -= dt
    this.message.style.opacity = this.messageTimer > 0 ? '1' : '0'
  }
}
