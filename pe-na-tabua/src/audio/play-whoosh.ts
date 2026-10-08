import type { PassSound } from './pass-bys'

// Objeto pequeno: agudo e curto. Pórtico por cima: grave. Carro: grave, longo e encorpado.
const SHAPES: Record<PassSound, { pitch: number; duration: number }> = {
  prop: { pitch: 1300, duration: 0.28 },
  overhead: { pitch: 380, duration: 0.45 },
  vehicle: { pitch: 620, duration: 0.5 },
}

// "Vush" de ruído filtrado vindo de `pan`, caindo de tom como um Doppler.
export function playWhoosh(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, gain: number, pan: number, sound: PassSound): void {
  const now = ctx.currentTime
  const { pitch, duration } = SHAPES[sound]
  const filter = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: pitch, Q: 1.1 })
  filter.frequency.exponentialRampToValueAtTime(pitch * 0.45, now + duration)
  const amp = new GainNode(ctx, { gain: 0.0001 })
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + duration * 0.15)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  const source = new AudioBufferSourceNode(ctx, { buffer: noise })
  source.connect(filter).connect(amp).connect(new StereoPannerNode(ctx, { pan })).connect(out)
  source.start(now, Math.random() * (noise.duration - duration), duration)
}
