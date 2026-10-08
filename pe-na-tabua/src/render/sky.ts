import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three'

// Fim de tarde: céu azul em cima, horizonte alaranjado (também a cor da neblina).
export const SKY_COLORS = { top: '#2f5fb3', horizon: '#f4b98a', ground: '#6d7356' }
export const SUN_DIRECTION = new Vector3(-0.6, 0.38, 0.7).normalize()

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

// Domo que acompanha a câmera.
export function createSky(): Mesh {
  const material = new ShaderMaterial({
    uniforms: {
      top: { value: new Color(SKY_COLORS.top) },
      horizon: { value: new Color(SKY_COLORS.horizon) },
      ground: { value: new Color(SKY_COLORS.ground) },
      sunDirection: { value: SUN_DIRECTION },
      sunColor: { value: new Color('#fff1d6') },
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
