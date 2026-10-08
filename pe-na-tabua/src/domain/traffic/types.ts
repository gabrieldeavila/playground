export type CarKind = 'sedan' | 'taxi'
export type Direction = 1 | -1 // 1 = mesmo sentido da corrida, -1 = contramão

// Carro civil em coordenadas de pista. Anda sempre na sua faixa, na velocidade dela.
export interface Car {
  id: number
  kind: CarKind
  s: number
  x: number
  speed: number // sempre positiva; o sentido vem de `direction`
  direction: Direction
}

export interface Lane {
  x: number
  direction: Direction
  speed: number // m/s
  cars: number // quantos carros nessa faixa na pista inteira
}
