import type { CourseRow } from './course-rows'

// Pistas do nível escolhido; a escolhida fica destacada.
export function coursesHtml(rows: CourseRow[], selected: string, mode: string, level: number): string {
  const items = rows.map((row) => {
    const classes = [row.cleared ? 'cleared' : 'next', row.name === selected ? 'selected' : ''].join(' ').trim()
    return `<li class="${classes}"><span class="name">${row.name.toUpperCase()}</span><span class="info">${row.km} km</span><span class="badge">${row.cleared ? 'CLEARED' : 'TO CLEAR'}</span></li>`
  })
  return `
    <h2>LEVEL ${level}</h2>
    <p class="tagline">${mode} · clear every course to unlock the next level</p>
    <ol class="levels">${items.join('')}</ol>
    <p class="cta">↑ ↓ choose · ENTER race · ESC back</p>
  `
}
