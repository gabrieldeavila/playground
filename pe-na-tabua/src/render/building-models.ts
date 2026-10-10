import { BoxGeometry, type BufferGeometry } from 'three'
import { mergeParts, paint } from './painted-geometry'

// Prédios low-poly com a base em y = 0 e a fachada virada para -x (a rua, do lado direito).
// O corpo é branco: a cor de cada prédio vem da instância (props-mesh). As faixas escuras de
// janela continuam escuras com qualquer cor.
const WALL = '#ffffff'
const GLASS = '#2a3341'
const TRIM = '#8d8984'
const FLOOR = 3.2 // m por andar

// Prédio de uns 5 andares, colado nos vizinhos.
export function createBlockModel(): BufferGeometry {
  return mergeParts([...body(12, 15, 14), ...windowBands(12, 14, 15), paint(new BoxGeometry(12.2, 2.4, 14.2), '#3b3631', 0, 1.2)])
}

// Torre alta e estreita.
export function createTowerModel(): BufferGeometry {
  return mergeParts([...body(12, 34, 12), ...windowBands(12, 12, 34), paint(new BoxGeometry(3, 2, 3), TRIM, 1.5, 35, 2)])
}

// Loja térrea com toldo e letreiro virados para a rua.
export function createShopModel(): BufferGeometry {
  return mergeParts([
    ...body(10, 5, 14),
    paint(new BoxGeometry(10.1, 2.2, 13), GLASS, 0, 1.6),
    paint(new BoxGeometry(1.8, 0.15, 12), '#b8452f', -5.9, 3.1),
    paint(new BoxGeometry(0.2, 0.9, 8), '#f1d36b', -5.1, 4.2),
  ])
}

function body(depth: number, height: number, length: number): BufferGeometry[] {
  return [
    paint(new BoxGeometry(depth, height, length), WALL, 0, height / 2),
    paint(new BoxGeometry(depth + 0.4, 0.5, length + 0.4), TRIM, 0, height + 0.25),
  ]
}

// Uma faixa de vidro por andar, dando a volta no prédio, acima do térreo.
function windowBands(depth: number, length: number, height: number): BufferGeometry[] {
  const bands: BufferGeometry[] = []
  for (let y = FLOOR + 1.4; y < height - 1; y += FLOOR) bands.push(paint(new BoxGeometry(depth + 0.1, 1.4, length + 0.1), GLASS, 0, y))
  return bands
}

// Poste de luz: braço sobre a rua (-x), luminária acesa na ponta.
export function createLampModel(): BufferGeometry {
  return mergeParts([
    paint(new BoxGeometry(0.2, 7, 0.2), '#4a4f55', 0, 3.5),
    paint(new BoxGeometry(2.4, 0.12, 0.12), '#4a4f55', -1.2, 7),
    paint(new BoxGeometry(0.7, 0.18, 0.32), '#fff1c2', -2.2, 6.9),
  ])
}
