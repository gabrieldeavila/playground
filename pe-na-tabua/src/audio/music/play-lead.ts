import { noteHz } from './note-hz'

const VIBRATO_HZ = 5.5
const VIBRATO_CENTS = 18

// Melodia: quadrada com vibrato, entra suave e segura a nota.
export function playLead(ctx: AudioContext, out: AudioNode, midi: number, t: number, duration: number): void {
  const osc = new OscillatorNode(ctx, { type: 'square', frequency: noteHz(midi) })
  const vibrato = new OscillatorNode(ctx, { type: 'sine', frequency: VIBRATO_HZ })
  vibrato.connect(new GainNode(ctx, { gain: VIBRATO_CENTS })).connect(osc.detune)
  const amp = new GainNode(ctx, { gain: 0 })
  amp.gain.setTargetAtTime(0.13, t, 0.015)
  amp.gain.setTargetAtTime(0, t + duration * 0.9, 0.04)
  osc.connect(new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 2400 })).connect(amp).connect(out)
  for (const node of [osc, vibrato]) {
    node.start(t)
    node.stop(t + duration + 0.25)
  }
}
