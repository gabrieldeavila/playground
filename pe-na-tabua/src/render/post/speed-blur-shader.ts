import { Vector2 } from 'three'

const TAPS = 10

// Borra a imagem na direção do ponto de fuga, só nas bordas, e escurece os cantos.
export const SPEED_BLUR_SHADER = {
  name: 'SpeedBlurShader',
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0 },
    center: { value: new Vector2(0.5, 0.6) }, // perto do horizonte da câmera de perseguição
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform vec2 center;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - center;
      float edge = smoothstep(0.12, 0.7, length(dir));
      vec2 stepUv = dir * amount * edge * 0.07 / float(${TAPS - 1});
      vec4 sum = vec4(0.0);
      for (int i = 0; i < ${TAPS}; i++) sum += texture2D(tDiffuse, vUv - stepUv * float(i));
      vec4 color = sum / float(${TAPS});
      float vignette = 1.0 - amount * 0.3 * smoothstep(0.35, 0.85, length(dir));
      gl_FragColor = vec4(color.rgb * vignette, color.a);
    }
  `,
}
