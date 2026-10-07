import { BoxGeometry, CircleGeometry, CylinderGeometry, Group, type Material, Mesh, MeshStandardMaterial, TorusGeometry } from 'three'
import { clamp } from '../../domain/math'
import { type DialSpec, dialAngle, drawDialFace } from './dial-face'

// Relógio analógico: mostrador, aro cromado e ponteiro.
export class Gauge {
  readonly group = new Group()
  private readonly needle: Mesh

  constructor(
    private readonly spec: DialSpec,
    radius: number,
    chrome: Material,
  ) {
    const face = new Mesh(new CircleGeometry(radius, 48), new MeshStandardMaterial({ map: drawDialFace(spec), roughness: 0.45 }))
    const bezel = new Mesh(new TorusGeometry(radius, radius * 0.09, 10, 48), chrome)
    const needleGeometry = new BoxGeometry(radius * 0.06, radius * 0.92, radius * 0.03).translate(0, radius * 0.34, radius * 0.04)
    this.needle = new Mesh(needleGeometry, new MeshStandardMaterial({ color: '#e0301e', emissive: '#7a1008', roughness: 0.4 }))
    const hubGeometry = new CylinderGeometry(radius * 0.1, radius * 0.1, radius * 0.06, 16).rotateX(Math.PI / 2).translate(0, 0, radius * 0.07)
    const hub = new Mesh(hubGeometry, new MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.5 }))
    this.group.add(face, bezel, this.needle, hub)
    this.set(0)
  }

  set(value: number): void {
    // O ponteiro aponta para +y com rotação zero.
    this.needle.rotation.z = dialAngle(clamp(value / this.spec.max, 0, 1)) - Math.PI / 2
  }
}
