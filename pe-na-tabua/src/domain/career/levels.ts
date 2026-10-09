// Um nível = uma volta por todas as pistas. Cada nível estica as pistas; o quanto a corrida
// aperta vem da dificuldade (ver difficulty.ts e challenge.ts).
export interface Level {
  number: number
  lengthScale: number // tamanho do miolo da pista em relação ao original
}

export const LEVELS: Level[] = [
  { number: 1, lengthScale: 1 },
  { number: 2, lengthScale: 1.15 },
  { number: 3, lengthScale: 1.3 },
  { number: 4, lengthScale: 1.45 },
  { number: 5, lengthScale: 1.6 },
]
