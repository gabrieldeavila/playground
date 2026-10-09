import type { Summary } from './summarize'

const COLUMNS = ['model', 'qualify', 'win', 'busted', 'avg place', 'car crash', 'KO', 'finish time']
const WIDTHS = [14, 8, 5, 7, 10, 10, 5, 12]

const percent = (share: number) => `${Math.round(share * 100)}%`

export function formatHeader(): string {
  return COLUMNS.map((title, i) => pad(title, i)).join(' ')
}

// Uma linha da tabela e, embaixo, as posições e os motivos das prisões.
export function formatRow(model: string, s: Summary): string {
  const cells = [
    model,
    percent(s.qualify),
    percent(s.win),
    percent(s.busted),
    s.meanPlace.toFixed(1),
    s.carCrashes.toFixed(1),
    s.knockouts.toFixed(1),
    `${s.meanTime.toFixed(0)} s`,
  ]
  const places = s.places.map((count, i) => `${i + 1}:${count}`).join(' ')
  const causes = [...s.bustCauses].map(([cause, count]) => `${cause}: ${count}`).join(', ')
  return [cells.map((cell, i) => pad(cell, i)).join(' '), `  places → ${places}`, causes && `  busted by → ${causes}`]
    .filter(Boolean)
    .join('\n')
}

function pad(text: string, column: number): string {
  return column === 0 ? text.padEnd(WIDTHS[0]) : text.padStart(WIDTHS[column])
}

// Uma linha por nível, uma coluna por modelo: "passa / preso".
export function formatMatrix(models: string[], rows: Summary[][]): string {
  const header = ['level', ...models].map((title, i) => (i === 0 ? title.padEnd(6) : title.padStart(15))).join(' ')
  const lines = rows.map((cells, i) =>
    [String(i + 1).padEnd(6), ...cells.map((s) => `${percent(s.qualify)} / ${percent(s.busted)}`.padStart(15))].join(' '),
  )
  return [header, ...lines].join('\n')
}
