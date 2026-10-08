const PARTIALS = [880, 1370, 2210] // parciais inarmônicos: soa como metal
const DURATION = 0.35

// Estalo metálico da corrente acertando.
export function playClang(ctx: AudioContext, out: AudioNode, gain: number, pan: number): void {
  const now = ctx.currentTime
  const amp = new GainNode(ctx, { gain: gain * 0.35 })
  amp.gain.exponentialRampToValueAtTime(0.0001, now + DURATION)
  amp.connect(new StereoPannerNode(ctx, { pan })).connect(out)
  for (const frequency of PARTIALS) {
    const tone = new OscillatorNode(ctx, { type: 'triangle', frequency })
    tone.connect(amp)
    tone.start(now)
    tone.stop(now + DURATION)
  }
}
