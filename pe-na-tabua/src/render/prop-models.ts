import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, DodecahedronGeometry, IcosahedronGeometry } from 'three'
import type { PropKind } from '../domain/track/types'
import { mergeParts, paint } from './painted-geometry'

// Modelos low-poly com a base em y = 0. Os troncos afundam para não flutuar em rampas.
export const PROP_MODELS: Record<PropKind, () => BufferGeometry> = {
  tree: () =>
    mergeParts([
      paint(new CylinderGeometry(0.16, 0.24, 3, 6), '#5b4330', 0, 1),
      paint(new IcosahedronGeometry(1.7, 0), '#5f8a3a', 0, 3.4),
      paint(new IcosahedronGeometry(1.15, 0), '#6f9a42', 0.7, 4.3, 0.3),
    ]),
  pine: () =>
    mergeParts([
      paint(new CylinderGeometry(0.13, 0.19, 2.2, 6), '#4d3a2a', 0, 0.6),
      paint(new ConeGeometry(1.5, 2.8, 7), '#2f5a32', 0, 2.6),
      paint(new ConeGeometry(1.1, 2.3, 7), '#356638', 0, 3.9),
      paint(new ConeGeometry(0.7, 1.9, 7), '#3d7040', 0, 5.1),
    ]),
  rock: () => paint(new DodecahedronGeometry(1, 0).scale(1, 0.6, 0.8), '#8b8478', 0, 0.25),
  post: () =>
    mergeParts([
      paint(new BoxGeometry(0.14, 1.6, 0.14), '#eeeeea', 0, 0.3),
      paint(new BoxGeometry(0.15, 0.14, 0.15), '#d23a2a', 0, 0.95),
    ]),
  sign: () =>
    mergeParts([
      paint(new BoxGeometry(0.1, 2.2, 0.1), '#3b3b3b', 0, 0.6),
      paint(new BoxGeometry(1.3, 0.8, 0.08), '#f0c419', 0, 1.6),
      paint(new BoxGeometry(1.4, 0.9, 0.06), '#1e1e1e', 0, 1.6, -0.03),
    ]),
}
