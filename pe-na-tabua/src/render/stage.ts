import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  type Vector3,
  WebGLRenderer,
} from 'three'
import { SKY_COLORS, SUN_DIRECTION } from './sky'

export interface Stage {
  renderer: WebGLRenderer
  scene: Scene
  camera: PerspectiveCamera
  sun: DirectionalLight
}

const SHADOW_EXTENT = 40

export function createStage(canvas: HTMLCanvasElement): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new Scene()
  scene.fog = new Fog(SKY_COLORS.horizon, 90, 700)
  const camera = new PerspectiveCamera(62, 1, 0.1, 3000)
  const sun = createSun()
  scene.add(new HemisphereLight('#bfd6ff', '#4a5a2a', 1.1), sun, sun.target)

  const fit = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', fit)
  fit()
  return { renderer, scene, camera, sun }
}

// A sombra só cobre uma caixa em volta do jogador; a luz anda junto com ele.
export function followSun(sun: DirectionalLight, focus: Vector3): void {
  sun.target.position.copy(focus)
  sun.position.copy(focus).addScaledVector(SUN_DIRECTION, 100)
}

function createSun(): DirectionalLight {
  const sun = new DirectionalLight('#ffe2b8', 2.6)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  const shadowCamera = sun.shadow.camera
  shadowCamera.left = -SHADOW_EXTENT
  shadowCamera.right = SHADOW_EXTENT
  shadowCamera.top = SHADOW_EXTENT
  shadowCamera.bottom = -SHADOW_EXTENT
  shadowCamera.near = 1
  shadowCamera.far = 220
  sun.shadow.bias = -0.0005
  sun.shadow.normalBias = 0.03
  return sun
}
