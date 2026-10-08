import { CylinderGeometry, type Material, Mesh, Vector3 } from 'three'

const UP = new Vector3(0, 1, 0)

// Cilindro ligando dois pontos (guidão, manoplas).
export function tubeBetween(a: Vector3, b: Vector3, radius: number, material: Material): Mesh {
  const direction = new Vector3().subVectors(b, a)
  const mesh = new Mesh(new CylinderGeometry(radius, radius, direction.length(), 12), material)
  mesh.position.copy(a).addScaledVector(direction, 0.5)
  mesh.quaternion.setFromUnitVectors(UP, direction.normalize())
  return mesh
}
