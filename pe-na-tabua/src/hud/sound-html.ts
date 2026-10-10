import { MAX_VOLUME, VOLUME_KEYS, VOLUME_NAMES, type Volumes } from '../domain/settings/volumes'

const bar = (level: number) => '■'.repeat(level) + '□'.repeat(MAX_VOLUME - level)

// Volumes como barras; o escolhido fica destacado.
export function soundHtml(volumes: Volumes, row: number): string {
  const items = VOLUME_KEYS.map((key, i) => {
    const chosen = i === row ? ' class="selected"' : ''
    return `<li${chosen}><span class="name">${VOLUME_NAMES[key].toUpperCase()}</span><span class="info volume-bar">${bar(volumes[key])}</span><span class="badge">${volumes[key]}</span></li>`
  })
  return `
    <h2>SOUND</h2>
    <p class="tagline">Engine and effects are heard in the race</p>
    <ol class="levels sound">${items.join('')}</ol>
    <p class="cta">↑ ↓ choose · ← → adjust · ESC back</p>
  `
}
