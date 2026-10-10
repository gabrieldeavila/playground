import { createRng } from '../random'
import type { Track } from '../track/types'
import { placeCrosswalks } from './place-crosswalks'
import { placePedestrians } from './place-pedestrians'
import { placePotholes } from './place-potholes'
import { placeRoadworks } from './place-roadworks'
import { streetSpan } from './street-span'
import type { Street } from './types'

// Semente própria, derivada da corrida: não mexe nos sorteios do trânsito e dos bots.
const STREET_SEED = 0x5eed

// Rua de cidade: faixas de pedestres, obras, buracos e pedestres. `scale` = densidade do
// desafio (1 = Outlaw nível 1). Pista que não é cidade não tem nada disso.
export function createStreet(track: Track, seed: number, scale = 1): Street {
  const rng = createRng(seed ^ STREET_SEED)
  if (!track.scenery.urban) return emptyStreet(rng)
  const span = streetSpan(track)
  const crosswalks = placeCrosswalks(track, span, rng)
  return {
    crosswalks,
    cones: placeRoadworks(track, span, crosswalks, rng, scale),
    potholes: placePotholes(span, rng, scale),
    pedestrians: placePedestrians(span, crosswalks, rng, scale),
    rng,
  }
}

export function emptyStreet(rng = createRng(STREET_SEED)): Street {
  return { crosswalks: [], potholes: [], cones: [], pedestrians: [], rng }
}
