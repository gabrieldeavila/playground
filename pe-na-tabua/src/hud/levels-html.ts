import type { LevelRow, LevelState } from './level-rows'

const BADGES: Record<LevelState, string> = { cleared: 'CLEARED', next: 'NEXT', locked: 'LOCKED' }

// Lista de níveis; o escolhido fica destacado.
export function levelsHtml(rows: LevelRow[], selected: number, mode: string, champion: boolean): string {
  const items = rows.map((row) => {
    const classes = [row.state, row.number === selected ? 'selected' : ''].join(' ').trim()
    const cops = `${row.cops} cop${row.cops === 1 ? '' : 's'}`
    const badge = [BADGES[row.state], row.progress].filter(Boolean).join(' ')
    return `<li class="${classes}"><span class="name">LEVEL ${row.number}</span><span class="info">${cops} · top ${row.qualifyPlace}</span><span class="badge">${badge}</span></li>`
  })
  return `
    <h2>${mode.toUpperCase()}${champion ? ' CHAMPION' : ''}</h2>
    <p class="tagline">Clear a level to unlock the next</p>
    <ol class="levels">${items.join('')}</ol>
    <p class="cta">↑ ↓ choose · ENTER race · ESC back</p>
  `
}
