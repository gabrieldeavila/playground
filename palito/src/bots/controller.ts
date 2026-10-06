import type { Input, PlayerIndex, World } from '../sim/types'

// O que um bot mostra antes de agir. É só visual (a simulação nem sabe disso),
// mas é por aqui que o jogador aprende a ler cada bot.
export type Tell = 'punch' | 'kick' | 'jump' | 'tired' | null

// Quem aperta os botões de um lutador a cada tick: o teclado ou um bot.
export interface Controller {
  read(world: World, index: PlayerIndex): Input
  tell?: Tell
}
