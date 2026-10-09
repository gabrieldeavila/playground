import type { Material, Mesh, Object3D, Texture } from 'three'

// Solta da GPU geometrias, materiais e texturas de tudo embaixo de `root`.
// Só para objetos que não dividem nada com quem continua na cena.
export function disposeTree(root: Object3D): void {
  root.traverse((object) => {
    const mesh = object as Mesh
    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
    for (const material of materials) disposeMaterial(material)
  })
}

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) if ((value as Texture | null)?.isTexture) (value as Texture).dispose()
  material.dispose()
}
