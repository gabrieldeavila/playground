const SMOOTH = 0.08 // s

// Ruído em loop por um filtro, com volume e corte ajustáveis: vento, raspada no guard-rail.
export class NoiseLoop {
  private readonly filter: BiquadFilterNode
  private readonly gain: GainNode

  constructor(
    private readonly ctx: AudioContext,
    out: AudioNode,
    noise: AudioBuffer,
    filter: BiquadFilterOptions,
  ) {
    this.filter = new BiquadFilterNode(ctx, filter)
    this.gain = new GainNode(ctx, { gain: 0 })
    const source = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true })
    source.connect(this.filter).connect(this.gain).connect(out)
    source.start()
  }

  set(gain: number, frequency?: number): void {
    const now = this.ctx.currentTime
    this.gain.gain.setTargetAtTime(gain, now, SMOOTH)
    if (frequency !== undefined) this.filter.frequency.setTargetAtTime(frequency, now, SMOOTH)
  }
}
