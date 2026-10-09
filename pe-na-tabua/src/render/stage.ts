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
import type { Theme } from './theme/theme'

export interface Stage {
  renderer: WebGLRenderer
  scene: Scene
  camera: PerspectiveCamera
  sun: DirectionalLight
  hemisphere: HemisphereLight
  fog: Fog
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
  const fog = new Fog('#ffffff', 90, 700)
  scene.fog = fog
  const camera = new PerspectiveCamera(62, 1, 0.1, 3000)
  const sun = createSun()
  const hemisphere = new HemisphereLight()
  scene.add(hemisphere, sun, sun.target)

  const fit = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', fit)
  fit()
  return { renderer, scene, camera, sun, hemisphere, fog }
}

// Neblina na cor do horizonte, luz do céu e do sol de cada pista.
export function setStageTheme(stage: Stage, theme: Theme): void {
  stage.fog.color.set(theme.sky.horizon)
  stage.fog.near = theme.fog.near
  stage.fog.far = theme.fog.far
  stage.hemisphere.color.set(theme.hemisphere.sky)
  stage.hemisphere.groundColor.set(theme.hemisphere.ground)
  stage.hemisphere.intensity = theme.hemisphere.intensity
  stage.sun.color.set(theme.sunLight.color)
  stage.sun.intensity = theme.sunLight.intensity
}

// A sombra só cobre uma caixa em volta do jogador; a luz anda junto com ele.
export function followSun(sun: DirectionalLight, focus: Vector3, direction: Vector3): void {
  sun.target.position.copy(focus)
  sun.position.copy(focus).addScaledVector(direction, 100)
}

function createSun(): DirectionalLight {
  const sun = new DirectionalLight()
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
