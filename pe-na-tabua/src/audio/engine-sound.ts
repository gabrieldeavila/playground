import { engineCutoff, engineGain, engineHz } from './levels'

const SMOOTH = 0.04 // s
const SHIFT_CUT = 0.25 // volume durante a troca de marcha
const SHIFT_TIME = 0.07 // s

// Vozes do motor: duas serras desafinadas dão o "batimento", a quadrada uma oitava abaixo dá peso.
const VOICES: { type: OscillatorType; ratio: number; detune: number; level: number }[] = [
  { type: 'sawtooth', ratio: 1, detune: -7, level: 0.45 },
  { type: 'sawtooth', ratio: 1, detune: 8, level: 0.45 },
  { type: 'square', ratio: 0.5, detune: 0, level: 0.3 },
]

// Motor sintetizado: osciladores -> distorção leve -> passa-baixa -> corte de troca -> volume.
export class EngineSound {
  private readonly oscillators: { node: OscillatorNode; ratio: number }[]
  private readonly filter: BiquadFilterNode
  private readonly cut: GainNode
  private readonly gain: GainNode

  constructor(
    private readonly ctx: AudioContext,
    out: AudioNode,
  ) {
    const shaper = new WaveShaperNode(ctx, { curve: softClip(), oversample: '2x' })
    this.filter = new BiquadFilterNode(ctx, { type: 'lowpass', Q: 3, frequency: 400 })
    this.cut = new GainNode(ctx, { gain: 1 })
    this.gain = new GainNode(ctx, { gain: 0 })
    shaper.connect(this.filter).connect(this.cut).connect(this.gain).connect(out)
    this.oscillators = VOICES.map((voice) => {
      const node = new OscillatorNode(ctx, { type: voice.type, detune: voice.detune, frequency: 40 })
      node.connect(new GainNode(ctx, { gain: voice.level })).connect(shaper)
      node.start()
      return { node, ratio: voice.ratio }
    })
  }

  update(rpm: number, throttle: number): void {
    const now = this.ctx.currentTime
    for (const { node, ratio } of this.oscillators) node.frequency.setTargetAtTime(engineHz(rpm) * ratio, now, SMOOTH)
    this.filter.frequency.setTargetAtTime(engineCutoff(rpm, throttle), now, SMOOTH)
    this.gain.gain.setTargetAtTime(engineGain(throttle), now, SMOOTH)
  }

  // Troca de marcha: a potência corta por um instante.
  shift(): void {
    const now = this.ctx.currentTime
    this.cut.gain.cancelScheduledValues(now)
    this.cut.gain.setValueAtTime(SHIFT_CUT, now)
    this.cut.gain.setTargetAtTime(1, now + SHIFT_TIME, 0.04)
  }
}

function softClip(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(256)
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / (curve.length - 1)) * 2 - 1) * 2.2)
  return curve
}
