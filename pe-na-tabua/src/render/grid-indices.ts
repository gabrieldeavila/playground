// Índices de uma malha em grade, linhas ao longo da pista e colunas da esquerda
// para a direita, com as faces viradas para cima.
export function gridIndices(rows: number, cols: number): number[] {
  const indices: number[] = []
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j
      const next = a + cols
      indices.push(a, a + 1, next, a + 1, next + 1, next)
    }
  }
  return indices
}
