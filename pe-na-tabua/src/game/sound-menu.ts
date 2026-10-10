import { clamp } from '../domain/math'
import { VOLUME_KEYS, type VolumeKey, type Volumes, adjustVolume } from '../domain/settings/volumes'

// Tela de som: qual volume está escolhido e os valores de cada um.
export class SoundMenu {
  row = 0

  constructor(public volumes: Volumes) {}

  get key(): VolumeKey {
    return VOLUME_KEYS[this.row]
  }

  select(delta: number): void {
    this.row = clamp(this.row + delta, 0, VOLUME_KEYS.length - 1)
  }

  adjust(delta: number): void {
    this.volumes = adjustVolume(this.volumes, this.key, delta)
  }
}
