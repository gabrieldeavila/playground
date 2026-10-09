import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three'
import type { Theme } from './theme/theme'

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 top;
  uniform vec3 horizon;
  uniform vec3 ground;
  uniform vec3 sunDirection;
  uniform vec3 sunColor;
  varying vec3 vDir;
  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;
    vec3 color = h > 0.0 ? mix(horizon, top, pow(h, 0.5)) : mix(horizon, ground, pow(-h, 0.4));
    float sun = max(dot(dir, sunDirection), 0.0);
    color += sunColor * (pow(sun, 800.0) * 6.0 + pow(sun, 8.0) * 0.35);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// Domo que acompanha a câmera. As cores vêm do tema (setSkyTheme).
export function createSky(): Mesh {
  const material = new ShaderMaterial({
    uniforms: {
      top: { value: new Color() },
      horizon: { value: new Color() },
      ground: { value: new Color() },
      sunDirection: { value: new Vector3(0, 1, 0) },
      sunColor: { value: new Color() },
    },
    vertexShader,
    fragmentShader,
    side: BackSide,
    depthWrite: false,
    fog: false,
  })
  const sky = new Mesh(new SphereGeometry(2500, 32, 16), material)
  sky.renderOrder = -1
  sky.frustumCulled = false
  return sky
}

export function setSkyTheme(sky: Mesh, theme: Theme): void {
  const { uniforms } = sky.material as ShaderMaterial
  uniforms.top.value.set(theme.sky.top)
  uniforms.horizon.value.set(theme.sky.horizon)
  uniforms.ground.value.set(theme.sky.ground)
  uniforms.sunColor.value.set(theme.sky.sun)
  uniforms.sunDirection.value.copy(theme.sunDirection)
}
