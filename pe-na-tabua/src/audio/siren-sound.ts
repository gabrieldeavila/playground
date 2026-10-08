const BASE_HZ = 900
const WAIL_HZ = 320 // quanto o tom sobe e desce
const WAIL_RATE = 0.45 // ciclos por segundo
const SMOOTH = 0.1 // s

// Sirene: onda quadrada abafada subindo e descendo, sempre tocando; o volume decide se aparece.
export class SirenSound {
  private readonly gain: GainNode
  private readonly panner: StereoPannerNode

  constructor(
    private readonly ctx: AudioContext,
    out: AudioNode,
  ) {
    const tone = new OscillatorNode(ctx, { type: 'square', frequency: BASE_HZ })
    const wail = new OscillatorNode(ctx, { type: 'sine', frequency: WAIL_RATE })
    wail.connect(new GainNode(ctx, { gain: WAIL_HZ })).connect(tone.frequency)
    this.gain = new GainNode(ctx, { gain: 0 })
    this.panner = new StereoPannerNode(ctx)
    tone.connect(new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 2200 })).connect(this.gain).connect(this.panner).connect(out)
    tone.start()
    wail.start()
  }

  set(gain: number, pan: number): void {
    const now = this.ctx.currentTime
    this.gain.gain.setTargetAtTime(gain, now, SMOOTH)
    this.panner.pan.setTargetAtTime(pan, now, SMOOTH)
  }
}
