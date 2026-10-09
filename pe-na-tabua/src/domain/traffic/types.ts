export type CarKind = 'sedan' | 'taxi'
export type Direction = 1 | -1 // 1 = mesmo sentido da corrida, -1 = contramão

// Troca para a faixa vizinha do mesmo sentido: seta ligada, depois desliza de lado.
export interface LaneChange {
  from: number // índice em LANES
  to: number
  elapsed: number // s desde que ligou a seta
}

// Carro civil em coordenadas de pista. Anda na velocidade da sua faixa; de vez em quando
// troca para a outra faixa do mesmo sentido, se houver espaço.
export interface Car {
  id: number
  kind: CarKind
  s: number
  x: number
  speed: number // sempre positiva; o sentido vem de `direction`
  direction: Direction
  lane: number // índice em LANES
  change: LaneChange | null
  changeTimer: number // s até pensar de novo em trocar de faixa
}

export interface Lane {
  x: number
  direction: Direction
  speed: number // m/s
  cars: number // quantos carros nessa faixa na pista inteira
}
