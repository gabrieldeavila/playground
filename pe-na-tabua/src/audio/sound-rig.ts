import { type Volumes, volumeGain } from '../domain/settings/volumes'
import { EngineSound } from './engine-sound'
import { MusicPlayer } from './music/music-player'
import { SONG } from './music/song'
import { createNoiseBuffer } from './noise-buffer'
import { NoiseLoop } from './noise-loop'
import type { PassSound } from './pass-bys'
import { playClang } from './play-clang'
import { playHorn } from './play-horn'
import { playImpact } from './play-impact'
import { playTok } from './play-tok'
import { playYelp } from './play-yelp'
import { playWhoosh } from './play-whoosh'
import { SirenSound } from './siren-sound'

const RACE_LEVEL = 0.8
const FADE = 0.15 // s

// Caminho do som: motor e efeitos -> corrida (liga/desliga com fade) -> volume geral -> limitador.
// A música vai direto ao volume geral: toca também nos menus.
export class SoundRig {
  readonly engine: EngineSound
  readonly wind: NoiseLoop
  readonly scrape: NoiseLoop
  readonly siren: SirenSound
  private readonly music: MusicPlayer
  private readonly main: GainNode
  private readonly race: GainNode
  private readonly engineLevel: GainNode
  private readonly effects: GainNode // tudo da corrida menos o motor
  private readonly noise: AudioBuffer
  private musicGain = 1

  constructor(readonly ctx: AudioContext) {
    const limiter = new DynamicsCompressorNode(ctx, { threshold: -10, ratio: 8 })
    this.main = new GainNode(ctx, { gain: 1 })
    this.main.connect(limiter).connect(ctx.destination)
    this.race = new GainNode(ctx, { gain: 0 })
    this.race.connect(this.main)
    this.engineLevel = new GainNode(ctx, { gain: 1 })
    this.engineLevel.connect(this.race)
    this.effects = new GainNode(ctx, { gain: 1 })
    this.effects.connect(this.race)
    this.noise = createNoiseBuffer(ctx)
    this.engine = new EngineSound(ctx, this.engineLevel)
    this.wind = new NoiseLoop(ctx, this.effects, this.noise, { type: 'lowpass', frequency: 300, Q: 0.5 })
    this.siren = new SirenSound(ctx, this.effects)
    this.scrape = new NoiseLoop(ctx, this.effects, this.noise, { type: 'bandpass', frequency: 3200, Q: 4 })
    this.music = new MusicPlayer(ctx, this.main, this.noise, SONG)
  }

  setOn(on: boolean): void {
    this.race.gain.setTargetAtTime(on ? RACE_LEVEL : 0, this.ctx.currentTime, FADE)
  }

  // Volumes escolhidos pelo jogador, por cima da mixagem.
  setVolumes(volumes: Volumes): void {
    const now = this.ctx.currentTime
    this.main.gain.setTargetAtTime(volumeGain(volumes.master), now, FADE)
    this.engineLevel.gain.setTargetAtTime(volumeGain(volumes.engine), now, FADE)
    this.effects.gain.setTargetAtTime(volumeGain(volumes.effects), now, FADE)
    this.musicGain = volumeGain(volumes.music)
  }

  // `level` é o volume da mixagem (menu ou corrida); o do jogador multiplica.
  setMusic(level: number): void {
    this.music.setVolume(level * this.musicGain)
  }

  whoosh(gain: number, pan: number, sound: PassSound): void {
    if (gain > 0.01) playWhoosh(this.ctx, this.effects, this.noise, gain, pan, sound)
  }

  clang(gain: number, pan: number): void {
    if (gain > 0.01) playClang(this.ctx, this.effects, gain, pan)
  }

  horn(gain: number, pan: number): void {
    playHorn(this.ctx, this.effects, gain, pan)
  }

  impact(gain: number, pan: number): void {
    if (gain > 0.01) playImpact(this.ctx, this.effects, this.noise, gain, pan)
  }

  yelp(gain: number, pan: number): void {
    if (gain > 0.01) playYelp(this.ctx, this.effects, gain, pan)
  }

  tok(gain: number, pan: number): void {
    if (gain > 0.01) playTok(this.ctx, this.effects, gain, pan)
  }
}
