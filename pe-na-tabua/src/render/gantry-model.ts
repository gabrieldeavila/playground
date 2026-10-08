import { BoxGeometry, type BufferGeometry } from 'three'
import { GANTRY_HALF_SPAN } from '../domain/track/prop-colliders'
import { mergeParts, paint } from './painted-geometry'

const HEIGHT = 6.4
const PANEL_WIDTH = 4.4

// Pórtico de placas sobre a pista; as placas viram para quem vem (+z).
export function createGantryModel(): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (const side of [-1, 1]) {
    parts.push(paint(new BoxGeometry(0.4, HEIGHT + 0.6, 0.4), '#8d939b', side * GANTRY_HALF_SPAN, HEIGHT / 2 - 0.3))
  }
  parts.push(paint(new BoxGeometry(GANTRY_HALF_SPAN * 2 + 0.4, 0.45, 0.45), '#8d939b', 0, HEIGHT))
  for (const x of [-PANEL_WIDTH / 2 - 0.3, PANEL_WIDTH / 2 + 0.3]) parts.push(...panel(x))
  return mergeParts(parts)
}

// Placa verde de estrada, com "linhas de texto" brancas.
function panel(x: number): BufferGeometry[] {
  const y = HEIGHT + 0.55
  const parts = [
    paint(new BoxGeometry(PANEL_WIDTH + 0.16, 1.86, 0.08), '#eeeeea', x, y, 0.24),
    paint(new BoxGeometry(PANEL_WIDTH, 1.7, 0.1), '#1f6b3a', x, y, 0.27),
  ]
  for (const [width, dy] of [[3.2, 0.35], [2.2, -0.15]]) {
    parts.push(paint(new BoxGeometry(width, 0.22, 0.04), '#eeeeea', x - (PANEL_WIDTH - width) / 2 + 0.3, y + dy, 0.34))
  }
  parts.push(paint(new BoxGeometry(0.5, 0.5, 0.04), '#eeeeea', x + PANEL_WIDTH / 2 - 0.6, y - 0.45, 0.34))
  return parts
}
