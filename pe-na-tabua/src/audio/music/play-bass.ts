import { noteHz } from './note-hz'

// Baixo: serra abafada, ataque firme e solta rápido.
export function playBass(ctx: AudioContext, out: AudioNode, midi: number, t: number, duration: number): void {
  const osc = new OscillatorNode(ctx, { type: 'sawtooth', frequency: noteHz(midi) })
  const filter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 700, Q: 2 })
  filter.frequency.setValueAtTime(700, t)
  filter.frequency.exponentialRampToValueAtTime(220, t + duration)
  const amp = new GainNode(ctx, { gain: 0 })
  amp.gain.setValueAtTime(0.4, t)
  amp.gain.setTargetAtTime(0, t + duration * 0.8, 0.02)
  osc.connect(filter).connect(amp).connect(out)
  osc.start(t)
  osc.stop(t + duration + 0.1)
}
