import { type BufferGeometry, Color, Float32BufferAttribute } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Peça de um modelo low-poly: posiciona e grava a cor nos vértices.
export function paint(geometry: BufferGeometry, color: string, x = 0, y = 0, z = 0): BufferGeometry {
  geometry.translate(x, y, z)
  const c = new Color(color)
  const count = geometry.getAttribute('position').count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) colors.set([c.r, c.g, c.b], i * 3)
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
}

// Poliedros do three vêm sem índice; padroniza tudo sem índice para poder juntar.
export function mergeParts(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts.map((part) => (part.index ? part.toNonIndexed() : part)))
  if (!merged) throw new Error('Peças com atributos incompatíveis')
  return merged
}
