const NOTES = [370, 466] // duas cornetas desafinadas, como buzina de carro
const DURATION = 0.5

// Buzina: duas ondas quadradas abafadas, vindo de `pan`.
export function playHorn(ctx: AudioContext, out: AudioNode, gain: number, pan: number): void {
  const now = ctx.currentTime
  const amp = new GainNode(ctx, { gain: 0 })
  amp.gain.linearRampToValueAtTime(gain, now + 0.02)
  amp.gain.setValueAtTime(gain, now + DURATION - 0.06)
  amp.gain.linearRampToValueAtTime(0, now + DURATION)
  amp.connect(new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 1800 })).connect(new StereoPannerNode(ctx, { pan })).connect(out)
  for (const frequency of NOTES) {
    const horn = new OscillatorNode(ctx, { type: 'square', frequency })
    horn.connect(amp)
    horn.start(now)
    horn.stop(now + DURATION)
  }
}
