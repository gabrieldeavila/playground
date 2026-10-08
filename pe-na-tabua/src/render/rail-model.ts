import { BoxGeometry, type BufferGeometry } from 'three'
import { SEGMENT_LENGTH } from '../domain/track/constants'
import { mergeParts, paint } from './painted-geometry'

// Um pouco mais longo que o segmento: do lado de fora da curva o arco é maior.
const LENGTH = SEGMENT_LENGTH * 1.15

// Lance de guard-rail ao longo de z: lâmina galvanizada, dois postes e olhos de gato.
export function createRailModel(): BufferGeometry {
  const parts = [paint(new BoxGeometry(0.08, 0.32, LENGTH), '#b7bcc2', 0, 0.62)]
  for (const z of [-1, 1]) {
    parts.push(paint(new BoxGeometry(0.12, 0.95, 0.12), '#6d7177', 0.06, 0.3, z))
  }
  parts.push(paint(new BoxGeometry(0.1, 0.1, 0.1), '#ff3b1f', -0.04, 0.62, 0))
  return mergeParts(parts)
}
