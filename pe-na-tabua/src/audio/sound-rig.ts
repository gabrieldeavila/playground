import { EngineSound } from './engine-sound'
import { createNoiseBuffer } from './noise-buffer'
import { NoiseLoop } from './noise-loop'
import type { PassSound } from './pass-bys'
import { playHorn } from './play-horn'
import { playImpact } from './play-impact'
import { playWhoosh } from './play-whoosh'

const MASTER = 0.8
const FADE = 0.15 // s

// Todos os sons ligados a um volume geral, que liga/desliga com fade.
export class SoundRig {
  readonly engine: EngineSound
  readonly wind: NoiseLoop
  readonly scrape: NoiseLoop
  private readonly master: GainNode
  private readonly noise: AudioBuffer

  constructor(readonly ctx: AudioContext) {
    const limiter = new DynamicsCompressorNode(ctx, { threshold: -10, ratio: 8 })
    this.master = new GainNode(ctx, { gain: 0 })
    this.master.connect(limiter).connect(ctx.destination)
    this.noise = createNoiseBuffer(ctx)
    this.engine = new EngineSound(ctx, this.master)
    this.wind = new NoiseLoop(ctx, this.master, this.noise, { type: 'lowpass', frequency: 300, Q: 0.5 })
    this.scrape = new NoiseLoop(ctx, this.master, this.noise, { type: 'bandpass', frequency: 3200, Q: 4 })
  }

  setOn(on: boolean): void {
    this.master.gain.setTargetAtTime(on ? MASTER : 0, this.ctx.currentTime, FADE)
  }

  whoosh(gain: number, pan: number, sound: PassSound): void {
    if (gain > 0.01) playWhoosh(this.ctx, this.master, this.noise, gain, pan, sound)
  }

  horn(gain: number, pan: number): void {
    playHorn(this.ctx, this.master, gain, pan)
  }

  impact(gain: number, pan: number): void {
    if (gain > 0.01) playImpact(this.ctx, this.master, this.noise, gain, pan)
  }
}
