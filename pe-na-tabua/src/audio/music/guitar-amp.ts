import { noteHz } from './note-hz'

// Power chord: tônica, quinta e oitava, cada uma com duas serras levemente desafinadas.
const INTERVALS = [0, 7, 12]
const DETUNE = [-6, 6]
const MUTED_CUTOFF = 900
const OPEN_CUTOFF = 3000

// Guitarra distorcida: todas as notas passam por um único "amplificador" (distorção + filtro).
export class GuitarAmp {
  private readonly input: GainNode

  constructor(
    private readonly ctx: AudioContext,
    out: AudioNode,
  ) {
    this.input = new GainNode(ctx, { gain: 1 })
    const drive = new WaveShaperNode(ctx, { curve: hardClip(), oversample: '4x' })
    const cabinet = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 3200, Q: 0.7 })
    this.input.connect(drive).connect(cabinet).connect(new GainNode(ctx, { gain: 0.12 })).connect(out)
  }

  chord(root: number, t: number, duration: number, muted: boolean): void {
    const filter = new BiquadFilterNode(this.ctx, { type: 'lowpass', frequency: muted ? MUTED_CUTOFF : OPEN_CUTOFF })
    const amp = new GainNode(this.ctx, { gain: 0 })
    amp.gain.setValueAtTime(muted ? 0.5 : 0.4, t)
    amp.gain.setTargetAtTime(0, t + duration * 0.85, 0.03)
    filter.connect(amp).connect(this.input)
    for (const interval of INTERVALS) {
      for (const detune of DETUNE) {
        const osc = new OscillatorNode(this.ctx, { type: 'sawtooth', frequency: noteHz(root + interval), detune })
        osc.connect(filter)
        osc.start(t)
        osc.stop(t + duration + 0.2)
      }
    }
  }
}

function hardClip(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(512)
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / (curve.length - 1)) * 2 - 1) * 8)
  return curve
}
