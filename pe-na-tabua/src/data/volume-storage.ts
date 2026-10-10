import type { Volumes } from '../domain/settings/volumes'
import { parseVolumes } from './parse-volumes'

const KEY = 'pe-na-tabua.volumes.v1'

// Volumes ficam fora do save da carreira: apagar a carreira não mexe no som.
export function loadVolumes(): Volumes {
  try {
    return parseVolumes(localStorage.getItem(KEY))
  } catch {
    return parseVolumes(null)
  }
}

export function storeVolumes(volumes: Volumes): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(volumes))
  } catch {
    // sem onde salvar: vale só até fechar a aba
  }
}
