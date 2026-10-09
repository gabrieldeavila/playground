// Jogadores simulados: o cérebro dos bots dirigindo, com "lapsos" — momentos em que o
// jogador não vê os carros. É um palpite de como uma pessoa joga, não uma medida.
export interface PlayerModel {
  name: string
  pace: number // fração da velocidade máxima que ele busca
  aggression: number // 0 = nunca briga
  lapseEvery: number // segundos, em média, entre um lapso e outro (Infinity = nunca)
  lapseLength: number // segundos sem ver o trânsito em cada lapso
}

export const PLAYER_MODELS: PlayerModel[] = [
  { name: 'casual', pace: 0.93, aggression: 0, lapseEvery: 8, lapseLength: 1.2 },
  { name: 'average', pace: 0.97, aggression: 0.4, lapseEvery: 15, lapseLength: 1 },
  { name: 'skilled', pace: 1, aggression: 0.7, lapseEvery: 40, lapseLength: 0.8 },
  { name: 'perfect (bot)', pace: 1, aggression: 0.7, lapseEvery: Infinity, lapseLength: 0 },
]
