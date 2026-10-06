import { STAGES } from './stages'

const STORAGE_KEY = 'palito:campanha'

export interface Progress {
  // Melhor número de estrelas por fase (0 = nunca venceu).
  stars: Record<string, number>
  // Derrotas por fase: depois da primeira, a apresentação mostra a dica.
  losses: Record<string, number>
}

export function loadProgress(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved) return { stars: saved.stars ?? {}, losses: saved.losses ?? {} }
  } catch {
    // Sem armazenamento (aba anônima, bloqueado): joga sem salvar.
  }
  return { stars: {}, losses: {} }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Idem.
  }
}

export function isUnlocked(progress: Progress, index: number): boolean {
  return index === 0 || (progress.stars[STAGES[index - 1].id] ?? 0) > 0
}
