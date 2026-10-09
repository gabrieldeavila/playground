import type { Verdict } from '../domain/career/career'

export interface VerdictText {
  headline: string
  detail: string
  cta: string
}

// Título, explicação e próximo passo da tela de resultado.
export function verdictText(verdict: Verdict, busted: boolean): VerdictText {
  if (verdict.champion) return { headline: 'CHAMPION!', detail: 'Every level cleared.', cta: 'ENTER race again · L levels' }
  if (verdict.unlocked) return { headline: 'QUALIFIED', detail: `Level ${verdict.unlocked} unlocked`, cta: `ENTER level ${verdict.unlocked} · L levels` }
  if (verdict.coursesLeft) {
    const courses = verdict.coursesLeft === 1 ? 'course' : 'courses'
    return { headline: 'QUALIFIED', detail: `${verdict.coursesLeft} more ${courses} to clear level ${verdict.level}`, cta: 'ENTER next course · L levels' }
  }
  if (verdict.qualified) return { headline: 'QUALIFIED', detail: 'Practice run', cta: 'ENTER next course · L levels' }
  return {
    headline: busted ? 'BUSTED!' : 'NOT QUALIFIED',
    detail: `Finish top ${verdict.qualifyPlace} to clear level ${verdict.level}`,
    cta: 'ENTER try again · L levels',
  }
}
