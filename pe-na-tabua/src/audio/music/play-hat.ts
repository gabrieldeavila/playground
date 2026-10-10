// Chimbal fechado: ruído bem agudo e curtinho.
export function playHat(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, t: number, accent: boolean): void {
  const source = new AudioBufferSourceNode(ctx, { buffer: noise })
  const amp = new GainNode(ctx, { gain: 0 })
  amp.gain.setValueAtTime(accent ? 0.16 : 0.09, t)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  source.connect(new BiquadFilterNode(ctx, { type: 'highpass', frequency: 7000 })).connect(amp).connect(out)
  source.start(t, Math.random() * (noise.duration - 0.06), 0.06)
}
