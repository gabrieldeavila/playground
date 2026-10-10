import { clamp } from '../math'

export type VolumeKey = 'master' | 'music' | 'engine' | 'effects'
export type Volumes = Record<VolumeKey, number>

export const VOLUME_KEYS: VolumeKey[] = ['master', 'music', 'engine', 'effects']
export const MAX_VOLUME = 10
const DEFAULT_LEVEL = 7 // a mixagem como foi afinada; dá para subir até 10

export const DEFAULT_VOLUMES: Volumes = { master: DEFAULT_LEVEL, music: DEFAULT_LEVEL, engine: DEFAULT_LEVEL, effects: DEFAULT_LEVEL }

export const VOLUME_NAMES: Record<VolumeKey, string> = { master: 'Master', music: 'Music', engine: 'Engine', effects: 'Effects' }

// Um passo para cima ou para baixo, sempre entre 0 e MAX_VOLUME.
export function adjustVolume(volumes: Volumes, key: VolumeKey, delta: number): Volumes {
  return { ...volumes, [key]: clamp(volumes[key] + delta, 0, MAX_VOLUME) }
}

// O ouvido percebe volume em escala de potência: o quadrado deixa os passos parecidos.
// No nível padrão o ganho é 1, a mixagem original.
export const volumeGain = (level: number) => (level / DEFAULT_LEVEL) ** 2
