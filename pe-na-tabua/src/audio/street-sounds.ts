import type { Race, RaceEvent } from '../domain/race/types'
import { impactGain, panFor } from './levels'
import type { SoundRig } from './sound-rig'

const POTHOLE_GAIN = 0.45 // tranco seco, mais baixo que uma batida

// Sons do que a moto acerta na rua. Devolve false se o evento não é da rua.
export function playStreetSound(rig: SoundRig, event: RaceEvent, race: Race): boolean {
  if (event.kind !== 'pedestrian' && event.kind !== 'cone' && event.kind !== 'pothole') return false
  const player = race.riders[race.playerId]
  const rider = race.riders[event.riderId]
  const gain = impactGain(Math.abs(rider.s - player.s))
  const pan = panFor(rider.x - player.x)
  if (event.kind === 'cone') rig.tok(gain, pan)
  else if (event.kind === 'pothole') rig.impact(gain * POTHOLE_GAIN, pan)
  else {
    rig.impact(gain * (event.crashed ? 1 : 0.6), pan)
    rig.yelp(gain, pan)
  }
  return true
}
