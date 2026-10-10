import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry } from 'three'
import { mergeParts, paint } from './painted-geometry'

// Cone de obra laranja com faixa refletiva, base em y = 0.
export function createConeGeometry(): BufferGeometry {
  return mergeParts([
    paint(new BoxGeometry(0.44, 0.05, 0.44), '#2a2a2a', 0, 0.025),
    paint(new ConeGeometry(0.2, 0.7, 10), '#f06a1d', 0, 0.4),
    paint(new CylinderGeometry(0.105, 0.135, 0.12, 10), '#f2f2ee', 0, 0.42),
  ])
}
