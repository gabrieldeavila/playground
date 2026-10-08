import { HalfFloatType, type PerspectiveCamera, type Scene, WebGLRenderTarget, type WebGLRenderer } from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { SPEED_BLUR_SHADER } from './speed-blur-shader'

const MIN_BLUR = 0.01 // abaixo disso pula o passe

// Desenha o mundo numa textura HDR, aplica o desfoque de velocidade e só então tone mapping/sRGB.
export class PostFx {
  private readonly composer: EffectComposer
  private readonly blur = new ShaderPass(SPEED_BLUR_SHADER)

  constructor(
    private readonly renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
  ) {
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 })
    this.composer = new EffectComposer(renderer, target)
    this.composer.addPass(new RenderPass(scene, camera))
    this.composer.addPass(this.blur)
    this.composer.addPass(new OutputPass())
    window.addEventListener('resize', () => this.fit())
    this.fit()
  }

  render(blurAmount: number): void {
    this.blur.enabled = blurAmount > MIN_BLUR
    this.blur.uniforms.amount.value = blurAmount
    this.composer.render()
  }

  private fit(): void {
    this.composer.setPixelRatio(this.renderer.getPixelRatio())
    this.composer.setSize(window.innerWidth, window.innerHeight)
  }
}
