// Pancada: um grave que despenca mais um estalo de ruído.
export function playImpact(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, gain: number, pan: number): void {
  const now = ctx.currentTime
  const panner = new StereoPannerNode(ctx, { pan })
  panner.connect(out)

  const thump = new OscillatorNode(ctx, { type: 'sine', frequency: 150 })
  thump.frequency.exponentialRampToValueAtTime(45, now + 0.2)
  const thumpGain = new GainNode(ctx, { gain: gain * 0.9 })
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
  thump.connect(thumpGain).connect(panner)
  thump.start(now)
  thump.stop(now + 0.26)

  const crack = new AudioBufferSourceNode(ctx, { buffer: noise })
  const crackGain = new GainNode(ctx, { gain: gain * 0.6 })
  crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
  crack.connect(new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 1800 })).connect(crackGain).connect(panner)
  crack.start(now, Math.random() * (noise.duration - 0.15), 0.13)
}
