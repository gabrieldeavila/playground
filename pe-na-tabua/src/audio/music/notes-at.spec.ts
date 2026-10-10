import { describe, expect, it } from 'vitest'
import { noteHz } from './note-hz'
import { STEPS_PER_BAR, notesAt, songSteps, stepSeconds } from './notes-at'
import { SONG } from './song'
import type { Song } from './song-types'

const SONG_OF_ONE_BAR: Song = {
  bpm: 120,
  bars: [
    {
      root: 40,
      guitar: 'X---x...........',
      bass: 'x.o.............',
      kick: 'x...............',
      snare: '....x...........',
      hat: 'x.x.............',
      lead: [{ step: 2, midi: 64, steps: 3 }],
    },
  ],
}

describe('notesAt', () => {
  it('acorde aberto segura pelos traços seguintes; abafado dura um passo', () => {
    expect(notesAt(SONG_OF_ONE_BAR, 0).guitar).toEqual({ midi: 40, steps: 4, muted: false })
    expect(notesAt(SONG_OF_ONE_BAR, 4).guitar).toEqual({ midi: 40, steps: 1, muted: true })
    expect(notesAt(SONG_OF_ONE_BAR, 1).guitar).toBeNull()
  })

  it('baixo toca a tônica uma oitava abaixo, ou a oitava', () => {
    expect(notesAt(SONG_OF_ONE_BAR, 0).bass).toBe(28)
    expect(notesAt(SONG_OF_ONE_BAR, 2).bass).toBe(40)
    expect(notesAt(SONG_OF_ONE_BAR, 1).bass).toBeNull()
  })

  it('bateria e melodia seguem os padrões', () => {
    expect(notesAt(SONG_OF_ONE_BAR, 0)).toMatchObject({ kick: true, snare: false, hat: true })
    expect(notesAt(SONG_OF_ONE_BAR, 4)).toMatchObject({ kick: false, snare: true })
    expect(notesAt(SONG_OF_ONE_BAR, 2).lead).toEqual({ midi: 64, steps: 3 })
  })

  it('dá a volta no fim da música', () => {
    expect(notesAt(SONG_OF_ONE_BAR, STEPS_PER_BAR)).toEqual(notesAt(SONG_OF_ONE_BAR, 0))
  })
})

describe('música', () => {
  it('toda barra tem 16 passos em cada padrão', () => {
    for (const bar of SONG.bars) {
      for (const pattern of [bar.guitar, bar.bass, bar.kick, bar.snare, bar.hat]) expect(pattern).toHaveLength(STEPS_PER_BAR)
    }
  })

  it('a melodia cabe na barra', () => {
    for (const note of SONG.bars.flatMap((bar) => bar.lead ?? [])) expect(note.step + note.steps).toBeLessThanOrEqual(STEPS_PER_BAR)
  })

  it('a volta dura entre 30 s e 2 min', () => {
    const seconds = songSteps(SONG) * stepSeconds(SONG.bpm)
    expect(seconds).toBeGreaterThan(30)
    expect(seconds).toBeLessThan(120)
  })

  it('Lá 440 e a oitava', () => {
    expect(noteHz(69)).toBe(440)
    expect(noteHz(57)).toBeCloseTo(220)
  })
})
