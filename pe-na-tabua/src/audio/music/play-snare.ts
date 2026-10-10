// Caixa: estalo de ruído com um pouco de corpo de um tom grave.
export function playSnare(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, t: number): void {
  const crack = new AudioBufferSourceNode(ctx, { buffer: noise })
  const crackGain = new GainNode(ctx, { gain: 0 })
  crackGain.gain.setValueAtTime(0.45, t)
  crackGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  crack.connect(new BiquadFilterNode(ctx, { type: 'highpass', frequency: 1200 })).connect(crackGain).connect(out)
  crack.start(t, Math.random() * (noise.duration - 0.2), 0.2)

  const body = new OscillatorNode(ctx, { type: 'triangle', frequency: 190 })
  const bodyGain = new GainNode(ctx, { gain: 0 })
  bodyGain.gain.setValueAtTime(0.35, t)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  body.connect(bodyGain).connect(out)
  body.start(t)
  body.stop(t + 0.1)
}
