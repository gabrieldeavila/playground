const DURATION = 0.09

// "Toc" oco de cone de plástico: um tom curto que cai rápido.
export function playTok(ctx: AudioContext, out: AudioNode, gain: number, pan: number): void {
  const now = ctx.currentTime
  const tone = new OscillatorNode(ctx, { type: 'triangle', frequency: 640 })
  tone.frequency.exponentialRampToValueAtTime(260, now + DURATION)
  const amp = new GainNode(ctx, { gain: gain * 0.45 })
  amp.gain.exponentialRampToValueAtTime(0.0001, now + DURATION)
  tone.connect(amp).connect(new StereoPannerNode(ctx, { pan })).connect(out)
  tone.start(now)
  tone.stop(now + DURATION + 0.01)
}
