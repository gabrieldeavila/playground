import { GuitarAmp } from './guitar-amp'
import { notesAt, stepSeconds } from './notes-at'
import { playBass } from './play-bass'
import { playHat } from './play-hat'
import { playKick } from './play-kick'
import { playLead } from './play-lead'
import { playSnare } from './play-snare'
import type { Song } from './song-types'

const LOOKAHEAD = 0.15 // s agendados à frente
const TICK_MS = 30
const FADE = 0.4 // s
const START_DELAY = 0.05 // s

// Toca a música em loop. Agenda as notas um pouco à frente do relógio do áudio,
// assim um quadro lento do jogo não atrasa o ritmo.
export class MusicPlayer {
  private readonly bus: GainNode
  private readonly guitar: GuitarAmp
  private timer: ReturnType<typeof setInterval> | null = null
  private step = 0
  private nextTime = 0

  constructor(
    private readonly ctx: AudioContext,
    out: AudioNode,
    private readonly noise: AudioBuffer,
    private readonly song: Song,
  ) {
    this.bus = new GainNode(ctx, { gain: 0 })
    this.bus.connect(out)
    this.guitar = new GuitarAmp(ctx, this.bus)
  }

  // Volume 0 para a música (e o agendador); qualquer volume acima retoma de onde parou.
  setVolume(volume: number): void {
    this.bus.gain.setTargetAtTime(volume, this.ctx.currentTime, FADE)
    if (volume > 0 && !this.timer) this.start()
    if (volume === 0 && this.timer) this.stop()
  }

  private start(): void {
    this.nextTime = this.ctx.currentTime + START_DELAY
    this.timer = setInterval(() => this.schedule(), TICK_MS)
  }

  private stop(): void {
    clearInterval(this.timer!)
    this.timer = null
  }

  private schedule(): void {
    const step = stepSeconds(this.song.bpm)
    // Aba escondida segura o timer: em vez de tocar tudo atrasado de uma vez, segue dali.
    if (this.nextTime < this.ctx.currentTime) this.nextTime = this.ctx.currentTime + START_DELAY
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime, step)
      this.step++
      this.nextTime += step
    }
  }

  private playStep(index: number, t: number, step: number): void {
    const notes = notesAt(this.song, index)
    if (notes.kick) playKick(this.ctx, this.bus, t)
    if (notes.snare) playSnare(this.ctx, this.bus, this.noise, t)
    if (notes.hat) playHat(this.ctx, this.bus, this.noise, t, index % 4 === 0)
    if (notes.bass !== null) playBass(this.ctx, this.bus, notes.bass, t, step * 1.6)
    if (notes.guitar) this.guitar.chord(notes.guitar.midi, t, notes.guitar.steps * step, notes.guitar.muted)
    if (notes.lead) playLead(this.ctx, this.bus, notes.lead.midi, t, notes.lead.steps * step)
  }
}
