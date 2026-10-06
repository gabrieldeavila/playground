import { Armadillo } from '../bots/armadillo'
import { Brawler } from '../bots/brawler'
import type { Controller } from '../bots/controller'
import { Jumper } from '../bots/jumper'
import { Kicker } from '../bots/kicker'
import { Rookie } from '../bots/rookie'
import type { ArenaTheme } from '../render/arena'
import type { Look } from '../render/stickman'

// Uma fase é só configuração: quem é o bot, como ele aparece, onde se luta e o que ele fala.
export interface Stage {
  id: string
  name: string
  // Apelido que aparece na apresentação.
  title: string
  look: Look
  arena: ArenaTheme
  // level = round atual (0, 1, 2): o bot fica mais esperto a cada round.
  createBot: (level: number) => Controller
  taunt: string
  // O que ele fala quando ganha de você.
  gloat: string
  // Aparece na apresentação depois que você perde para ele uma vez.
  tip: string
}

export const STAGES: Stage[] = [
  {
    id: 'novato',
    name: 'Novato',
    title: 'Faixa branca',
    look: { color: '#b8bfcc', width: 4, accessory: 'belt' },
    arena: 'dojo',
    createBot: (level) => new Rookie(level),
    taunt: 'É... minha primeira luta também.',
    gloat: 'Ué, ganhei?',
    tip: 'Quando aparecer o "!", ele vai bater: saia de perto ou defenda (H) e bata logo depois.',
  },
  {
    id: 'brigao',
    name: 'Brigão',
    title: 'O terror do beco',
    look: { color: '#ff8a3d', width: 7, accessory: 'bandana' },
    arena: 'alley',
    createBot: (level) => new Brawler(level),
    taunt: 'Vem! Vou te encher de soco!',
    gloat: 'Falei que ia te encher de soco.',
    tip: 'Ele puxa o braço antes da rajada. Defenda (H) até acabar: depois ele fica cansado e parado.',
  },
  {
    id: 'chutador',
    name: 'Chutador',
    title: 'Pernas de mola',
    look: { color: '#5fd17a', width: 5, accessory: 'sneakers' },
    arena: 'park',
    createBot: (level) => new Kicker(level),
    taunt: 'Daqui você não passa.',
    gloat: 'Distância é tudo.',
    tip: 'O chute dele é baixo: quando ele levantar a perna, pule (W) por cima e bata enquanto ele recolhe.',
  },
  {
    id: 'tatu',
    name: 'Tatu',
    title: 'Ninguém acerta o casco',
    look: { color: '#c9a36b', width: 6, accessory: 'shell' },
    arena: 'cave',
    createBot: (level) => new Armadillo(level),
    taunt: 'Pode vir. Eu espero aqui embaixo.',
    gloat: 'Soco passa por cima, sabia?',
    tip: 'Agachado, o soco passa por cima dele. Use o chute (G): ele pega baixo.',
  },
  {
    id: 'pulador',
    name: 'Pulador',
    title: 'Dono dos telhados',
    look: { color: '#ffd23f', width: 5, accessory: 'trail' },
    arena: 'rooftops',
    createBot: (level) => new Jumper(level),
    taunt: 'Olha pra cima!',
    gloat: 'Nem me viu chegar.',
    tip: 'Ele agacha antes do pulo. Soque (F) quando ele estiver caindo em você, ou defenda e bata quando ele pousar.',
  },
]
