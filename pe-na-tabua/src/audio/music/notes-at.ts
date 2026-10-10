import type { Bar, Song, StepNotes } from './song-types'

export const STEPS_PER_BAR = 16
const BASS_DROP = 12 // o baixo toca uma oitava abaixo da guitarra

// Duração de uma semicolcheia em segundos.
export const stepSeconds = (bpm: number) => 60 / bpm / 4

export const songSteps = (song: Song) => song.bars.length * STEPS_PER_BAR

// O que soa no passo `step` da música (dá a volta no fim).
export function notesAt(song: Song, step: number): StepNotes {
  const total = songSteps(song)
  const index = ((step % total) + total) % total
  const bar = song.bars[Math.floor(index / STEPS_PER_BAR)]
  const i = index % STEPS_PER_BAR
  return {
    kick: bar.kick[i] === 'x',
    snare: bar.snare[i] === 'x',
    hat: bar.hat[i] === 'x',
    bass: bassAt(bar, i),
    guitar: guitarAt(bar, i),
    lead: leadAt(bar, i),
  }
}

function bassAt(bar: Bar, i: number): number | null {
  const mark = bar.bass[i]
  if (mark === 'x') return bar.root - BASS_DROP
  if (mark === 'o') return bar.root
  return null
}

function guitarAt(bar: Bar, i: number): StepNotes['guitar'] {
  const mark = bar.guitar[i]
  if (mark === 'x') return { midi: bar.root, steps: 1, muted: true }
  if (mark === 'X') return { midi: bar.root, steps: 1 + heldSteps(bar.guitar, i + 1), muted: false }
  return null
}

function heldSteps(pattern: string, from: number): number {
  let held = 0
  while (pattern[from + held] === '-') held++
  return held
}

function leadAt(bar: Bar, i: number): StepNotes['lead'] {
  const note = bar.lead?.find((n) => n.step === i)
  return note ? { midi: note.midi, steps: note.steps } : null
}
