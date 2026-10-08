import { BoxGeometry, type BufferGeometry, CylinderGeometry, MeshStandardMaterial } from 'three'
import type { WeaponKind } from '../domain/race/types'
import { mergeParts, paint } from './painted-geometry'

const LINKS = 10
const LINK_STEP = 0.075

// Empunhadura na origem, a arma se estende para -z (continuação do braço).
export function createWeaponGeometry(kind: WeaponKind): BufferGeometry {
  return kind === 'club' ? club() : chain()
}

export function createWeaponMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.5, metalness: 0.2 })
}

// Taco de madeira com fita no cabo.
function club(): BufferGeometry {
  return mergeParts([
    paint(new CylinderGeometry(0.035, 0.035, 0.2, 8).rotateX(Math.PI / 2), '#1d1f24', 0, 0, -0.1),
    paint(new CylinderGeometry(0.065, 0.045, 0.55, 8).rotateX(Math.PI / 2), '#7a5230', 0, 0, -0.47),
  ])
}

// Corrente: elos alternando de plano, enrolada na mão.
function chain(): BufferGeometry {
  const parts = [paint(new BoxGeometry(0.08, 0.08, 0.08), '#1d1f24', 0, 0, 0)]
  for (let i = 0; i < LINKS; i++) {
    const link = i % 2 === 0 ? new BoxGeometry(0.085, 0.026, 0.1) : new BoxGeometry(0.026, 0.085, 0.1)
    parts.push(paint(link, '#a3a9b0', 0, 0, -0.07 - i * LINK_STEP))
  }
  return mergeParts(parts)
}
