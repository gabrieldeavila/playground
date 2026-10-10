const DURATION = 0.32

// "Ôu!" de desenho animado: um tom anasalado que cai, passado por um filtro de voz.
export function playYelp(ctx: AudioContext, out: AudioNode, gain: number, pan: number): void {
  const now = ctx.currentTime
  const pitch = 520 + Math.random() * 260
  const voice = new OscillatorNode(ctx, { type: 'sawtooth', frequency: pitch })
  voice.frequency.exponentialRampToValueAtTime(pitch * 0.55, now + DURATION)
  const amp = new GainNode(ctx, { gain: 0.0001 })
  amp.gain.exponentialRampToValueAtTime(gain * 0.3, now + 0.03)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + DURATION)
  voice
    .connect(new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 1100, Q: 2.5 }))
    .connect(amp)
    .connect(new StereoPannerNode(ctx, { pan }))
    .connect(out)
  voice.start(now)
  voice.stop(now + DURATION + 0.02)
}
