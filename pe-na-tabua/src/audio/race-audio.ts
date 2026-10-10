import { nearestChasingCop } from '../domain/police/nearest-cop'
import { IDLE_RPM, gearFor, rpmFor } from '../domain/race/gearbox'
import type { Race, RaceEvent, Rider } from '../domain/race/types'
import type { Volumes } from '../domain/settings/volumes'
import { Horns } from './horns'
import { SIREN_RANGE, hornGain, impactGain, musicVolume, panFor, revRpm, scrapeGain, sirenGain, whooshGain, windCutoff, windGain } from './levels'
import { PassBys } from './pass-bys'
import { SoundRig } from './sound-rig'
import { playStreetSound } from './street-sounds'

const VEHICLE_BOOST = 1.6 // carro é maior: passa fazendo mais barulho
const WEAPON_BOOST = 1.4 // golpe de arma bate mais forte

// Liga a corrida aos sons. O AudioContext só nasce no primeiro gesto do usuário.
export class RaceAudio {
  private rig: SoundRig | null = null
  private muted = false
  private gear = 1
  private volumes: Volumes | null = null
  private readonly passBys = new PassBys()
  private readonly horns = new Horns()

  // Navegadores só liberam áudio dentro de um evento do usuário: chamar no keydown.
  unlock(): void {
    if (!this.rig) {
      this.rig = new SoundRig(new AudioContext())
      if (this.volumes) this.rig.setVolumes(this.volumes)
    }
    if (this.rig.ctx.state === 'suspended') void this.rig.ctx.resume()
  }

  toggleMute(): void {
    this.muted = !this.muted
  }

  setVolumes(volumes: Volumes): void {
    this.volumes = volumes
    this.rig?.setVolumes(volumes)
  }

  reset(): void {
    this.passBys.reset()
    this.horns.reset()
    this.gear = 1
  }

  update(race: Race, throttle: number, racing: boolean): void {
    const rig = this.rig
    if (!rig) return
    rig.setOn(racing && !this.muted)
    rig.setMusic(this.muted ? 0 : musicVolume(racing))
    if (!racing) return
    const player = race.riders[race.playerId]
    this.updateEngine(rig, race, player, throttle)
    rig.wind.set(windGain(player.speed), windCutoff(player.speed))
    rig.scrape.set(player.scraping ? scrapeGain(player.speed) : 0)
    for (const pass of this.passBys.take(race)) {
      const boost = pass.sound === 'vehicle' ? VEHICLE_BOOST : 1
      rig.whoosh(whooshGain(pass.speed, pass.lateral) * boost, panFor(pass.lateral), pass.sound)
    }
    for (const car of this.horns.take(race)) rig.horn(hornGain(car.s - player.s), panFor(car.x - player.x))
    const cop = nearestChasingCop(race, SIREN_RANGE)
    rig.siren.set(cop ? sirenGain(Math.abs(cop.gap)) : 0, cop ? panFor(cop.cop.x - player.x) : 0)
  }

  onEvent(event: RaceEvent, race: Race): void {
    if (this.rig && playStreetSound(this.rig, event, race)) return
    const target = event.kind === 'hit' || event.kind === 'knockout' ? event.targetId : event.kind === 'crash' ? event.riderId : null
    if (!this.rig || target === null) return
    const player = race.riders[race.playerId]
    const rider = race.riders[target]
    const weapon = event.kind === 'hit' && (event.attack === 'club' || event.attack === 'chain') ? event.attack : null
    const gain = impactGain(Math.abs(rider.s - player.s))
    const pan = panFor(rider.x - player.x)
    this.rig.impact(gain * (weapon ? WEAPON_BOOST : 1), pan)
    if (weapon === 'chain') this.rig.clang(gain, pan)
  }

  private updateEngine(rig: SoundRig, race: Race, player: Rider, throttle: number): void {
    if (player.crashTimer > 0) return rig.engine.update(IDLE_RPM, 0)
    const rpm = race.phase === 'countdown' ? revRpm(throttle) : rpmFor(player.speed)
    rig.engine.update(rpm, throttle)
    const gear = gearFor(player.speed)
    if (gear > this.gear) rig.engine.shift()
    this.gear = gear
  }
}
