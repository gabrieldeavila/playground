import type { Bar, LeadNote, Song } from './song-types'

// "Pé na Tábua" — rock em Mi menor, composição própria. Estrofe com guitarra abafada galopando,
// refrão com acordes abertos e uma melodia por cima.
const E = 40
const C = 36
const D = 38
const G = 43

const BEAT = { kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }
const DRIVE = { kick: 'x.x...x.x.x...x.', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx' }
const FILL = { kick: 'x.......x.......', snare: '....x...x.xxxxxx', hat: 'x.x.x.x.........' }

const CHUG = 'x.xx.xx.x.xx.xx.'
const OPEN = 'X-------X-----X-'
const GALLOP = 'x.x.x.x.x.x.x.xo'
const PUMP = 'x.xox.xox.xox.xo'

const verse = (root: number): Bar => ({ root, guitar: CHUG, bass: GALLOP, ...BEAT })
const chorus = (root: number, lead: LeadNote[], drums = DRIVE): Bar => ({ root, guitar: OPEN, bass: PUMP, ...drums, lead })

const n = (step: number, midi: number, steps: number): LeadNote => ({ step, midi, steps })

const VERSE = [verse(E), verse(E), verse(C), verse(D)]
const CHORUS = [
  chorus(C, [n(0, 67, 4), n(4, 64, 2), n(6, 67, 2), n(8, 72, 6), n(14, 71, 2)]),
  chorus(D, [n(0, 69, 4), n(4, 66, 2), n(6, 69, 2), n(8, 74, 6), n(14, 72, 2)]),
  chorus(G, [n(0, 71, 6), n(6, 67, 2), n(8, 71, 4), n(12, 74, 4)]),
  chorus(E, [n(0, 76, 12)], FILL),
]

export const SONG: Song = {
  bpm: 144,
  bars: [...VERSE, ...VERSE, ...CHORUS, ...VERSE, ...CHORUS],
}
