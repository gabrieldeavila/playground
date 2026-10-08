import { IDLE_RPM, gearFor, rpmFor } from '../domain/race/gearbox'
import type { Race, RaceEvent, Rider } from '../domain/race/types'
import { impactGain, panFor, revRpm, scrapeGain, whooshGain, windCutoff, windGain } from './levels'
import { PassBys } from './pass-bys'
import { SoundRig } from './sound-rig'

// Liga a corrida aos sons. O AudioContext só nasce no primeiro gesto do usuário.
export class RaceAudio {
  private rig: SoundRig | null = null
  private muted = false
  private gear = 1
  private readonly passBys = new PassBys()

  // Navegadores só liberam áudio dentro de um evento do usuário: chamar no keydown.
  unlock(): void {
    this.rig ??= new SoundRig(new AudioContext())
    if (this.rig.ctx.state === 'suspended') void this.rig.ctx.resume()
  }

  toggleMute(): void {
    this.muted = !this.muted
  }

  reset(): void {
    this.passBys.reset()
    this.gear = 1
  }

  update(race: Race, throttle: number, racing: boolean): void {
    const rig = this.rig
    if (!rig) return
    rig.setOn(racing && !this.muted)
    if (!racing) return
    const player = race.riders[race.playerId]
    this.updateEngine(rig, race, player, throttle)
    rig.wind.set(windGain(player.speed), windCutoff(player.speed))
    rig.scrape.set(player.scraping ? scrapeGain(player.speed) : 0)
    for (const pass of this.passBys.take(race)) rig.whoosh(whooshGain(player.speed, pass.lateral), panFor(pass.lateral), pass.overhead)
  }

  onEvent(event: RaceEvent, race: Race): void {
    const target = event.kind === 'hit' || event.kind === 'knockout' ? event.targetId : event.kind === 'crash' ? event.riderId : null
    if (!this.rig || target === null) return
    const player = race.riders[race.playerId]
    const rider = race.riders[target]
    this.rig.impact(impactGain(Math.abs(rider.s - player.s)), panFor(rider.x - player.x))
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
