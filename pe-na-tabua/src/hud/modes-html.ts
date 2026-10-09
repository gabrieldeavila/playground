import type { ModeRow } from './mode-rows'

// Escolha do modo; o escolhido fica destacado.
export function modesHtml(rows: ModeRow[], selected: string): string {
  const items = rows.map((row) => {
    const chosen = row.id === selected ? ' class="selected"' : ''
    return `<li${chosen}><span class="name">${row.name.toUpperCase()}</span><span class="info">${row.blurb}</span><span class="badge">${row.progress.toUpperCase()}</span></li>`
  })
  return `
    <h2>CHOOSE YOUR RIDE</h2>
    <p class="tagline">Each mode keeps its own progress</p>
    <ol class="levels modes">${items.join('')}</ol>
    <p class="cta">↑ ↓ choose · ENTER pick · ESC back</p>
  `
}
