import {
  DirectionalLight,
  Group,
  HemisphereLight,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  type WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { lerp } from '../../domain/math'
import { MAX_SPEED } from '../../domain/race/constants'
import { IDLE_RPM, gearFor, rpmFor } from '../../domain/race/gearbox'
import type { Rider } from '../../domain/race/types'
import type { RiderColors } from '../rider-colors'
import { CockpitLimbs } from './cockpit-limbs'
import { createFairing } from './fairing'
import { Gauge } from './gauge'
import { GearDisplay } from './gear-display'
import { COCKPIT_FOV, DISTANCE, HALF_HEIGHT } from './layout'

const GAUGE_RADIUS = 0.068
const NEEDLE_RESPONSE = 12
// Abaixo dessa proporção de tela o painel encolhe para caber na largura.
const FULL_SIZE_ASPECT = 1.5

// Painel da moto em primeira pessoa, desenhado por cima do mundo numa segunda passada.
export class Cockpit {
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(COCKPIT_FOV, 1, 0.01, 10)
  private readonly rig = new Group()
  private readonly speedometer: Gauge
  private readonly tachometer: Gauge
  private readonly display = new GearDisplay(0.05)
  private readonly limbs: CockpitLimbs
  private shownKmh = 0
  private shownRpm = IDLE_RPM

  constructor(renderer: WebGLRenderer, colors: RiderColors) {
    const chrome = new MeshStandardMaterial({ color: '#c9ced6', roughness: 0.2, metalness: 1 })
    this.speedometer = new Gauge({ max: 280, labelStep: 40, minorStep: 20, unit: 'km/h' }, GAUGE_RADIUS, chrome)
    this.tachometer = new Gauge({ max: 13, labelStep: 1, minorStep: 0.5, unit: 'x1000 rpm', redFrom: 11 }, GAUGE_RADIUS, chrome)
    this.speedometer.group.position.set(-0.1, 0.105, 0.02)
    this.tachometer.group.position.set(0.1, 0.105, 0.02)
    this.display.mesh.position.set(0, 0.145, 0.017)
    this.limbs = new CockpitLimbs(colors)

    this.rig.position.set(0, -HALF_HEIGHT, -DISTANCE)
    this.rig.add(createFairing(colors.bike, chrome), this.speedometer.group, this.tachometer.group, this.display.mesh, this.limbs.group)
    this.scene.add(this.rig, ...createLights())
    this.scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.5

    window.addEventListener('resize', () => this.fit())
    this.fit()
  }

  update(rider: Rider, dt: number, time: number): void {
    const k = 1 - Math.exp(-NEEDLE_RESPONSE * dt)
    this.shownKmh = lerp(this.shownKmh, rider.speed * 3.6, k)
    this.shownRpm = lerp(this.shownRpm, rpmFor(rider.speed), k)
    this.speedometer.set(this.shownKmh)
    this.tachometer.set(this.shownRpm / 1000)
    this.display.show(gearFor(rider.speed), Math.round(rider.speed * 3.6))
    this.limbs.pose(rider.attack)
    // Vibração do motor, mais forte com velocidade.
    const shake = 0.3 + rider.speed / MAX_SPEED
    this.rig.position.y = -HALF_HEIGHT + Math.sin(time * 47) * 0.0012 * shake
    this.rig.rotation.z = Math.sin(time * 31) * 0.002 * shake
  }

  render(renderer: WebGLRenderer): void {
    const autoClear = renderer.autoClear
    renderer.autoClear = false
    renderer.clearDepth()
    renderer.render(this.scene, this.camera)
    renderer.autoClear = autoClear
  }

  private fit(): void {
    const aspect = window.innerWidth / window.innerHeight
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
    this.rig.scale.setScalar(Math.min(1, aspect / FULL_SIZE_ASPECT))
  }
}

// Mesma direção do sol do mundo: de trás e da esquerda.
function createLights(): (HemisphereLight | DirectionalLight)[] {
  const sun = new DirectionalLight('#ffe2b8', 2.2)
  sun.position.set(-0.6, 1, 0.8)
  return [new HemisphereLight('#dfe9ff', '#3a3020', 1.2), sun]
}
