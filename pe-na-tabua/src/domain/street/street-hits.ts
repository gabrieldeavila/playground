import { alertCopsNear } from '../police/alert'
import type { Race, RaceEvent, Rider } from '../race/types'
import { PEDESTRIAN_ALERT_RANGE } from './constants'
import { hitCones } from './hit-cone'
import { hitPedestrian } from './hit-pedestrian'
import { hitPothole } from './hit-pothole'

// O que a moto acertou na rua neste passo. `fromS` = onde ela estava no começo do passo.
// Atropelar alguém perto da polícia faz ela vir atrás do jogador.
export function streetHits(race: Race, rider: Rider, fromS: number): RaceEvent[] {
  const street = race.street
  const events: RaceEvent[] = []
  if (hitPothole(rider, street.potholes, fromS)) events.push({ kind: 'pothole', riderId: rider.id })
  if (hitCones(rider, street.cones, street.rng) > 0) events.push({ kind: 'cone', riderId: rider.id })
  const hit = hitPedestrian(rider, street.pedestrians, street.rng)
  if (!hit) return events
  events.push({ kind: 'pedestrian', riderId: rider.id, crashed: hit.crashed })
  if (rider.id === race.playerId) events.push(...alertCopsNear(race, PEDESTRIAN_ALERT_RANGE))
  return events
}
