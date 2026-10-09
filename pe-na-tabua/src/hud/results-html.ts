import type { Verdict } from '../domain/career/career'
import type { Rider } from '../domain/race/types'
import { formatTime, ordinal } from './format-time'
import { verdictText } from './verdict-text'

// Classificação da corrida com o veredito em cima. Preso: o jogador aparece como DNF.
export function resultsHtml(order: Rider[], playerId: number, busted: boolean, verdict: Verdict): string {
  const text = verdictText(verdict, busted)
  const rows = order.map((rider, i) => {
    const time = rider.finishTime === null ? 'DNF' : formatTime(rider.finishTime)
    const mine = rider.id === playerId ? ' class="me"' : ''
    return `<tr${mine}><td>${ordinal(i + 1)}</td><td>${rider.name}</td><td>${time}</td></tr>`
  })
  return `
    <h2 class="${verdict.qualified ? 'won' : 'lost'}">${text.headline}</h2>
    <p class="tagline">${text.detail}</p>
    <table class="results">${rows.join('')}</table>
    <p class="cta">${text.cta}</p>
  `
}
