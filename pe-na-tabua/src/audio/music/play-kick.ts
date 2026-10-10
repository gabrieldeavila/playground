// Bumbo: seno que despenca de tom em um instante.
export function playKick(ctx: AudioContext, out: AudioNode, t: number): void {
  const osc = new OscillatorNode(ctx, { type: 'sine', frequency: 140 })
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.12)
  const amp = new GainNode(ctx, { gain: 0 })
  amp.gain.setValueAtTime(0.9, t)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
  osc.connect(amp).connect(out)
  osc.start(t)
  osc.stop(t + 0.31)
}
