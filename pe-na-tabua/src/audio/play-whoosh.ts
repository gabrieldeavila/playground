const DURATION = 0.28 // s
const OVERHEAD_DURATION = 0.45

// "Vush" de ruído filtrado vindo de `pan`, caindo de tom como um Doppler. Por cima é mais grave e longo.
export function playWhoosh(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, gain: number, pan: number, overhead: boolean): void {
  const now = ctx.currentTime
  const duration = overhead ? OVERHEAD_DURATION : DURATION
  const pitch = overhead ? 380 : 1300
  const filter = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: pitch, Q: 1.1 })
  filter.frequency.exponentialRampToValueAtTime(pitch * 0.45, now + duration)
  const amp = new GainNode(ctx, { gain: 0.0001 })
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + duration * 0.15)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  const source = new AudioBufferSourceNode(ctx, { buffer: noise })
  source.connect(filter).connect(amp).connect(new StereoPannerNode(ctx, { pan })).connect(out)
  source.start(now, Math.random() * (noise.duration - duration), duration)
}
