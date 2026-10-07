import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three'

const WIDTH = 128
const HEIGHT = 96

// Visor digital entre os relógios: marcha grande, velocidade embaixo.
export class GearDisplay {
  readonly mesh: Mesh
  private readonly ctx: CanvasRenderingContext2D
  private readonly texture: CanvasTexture
  private shown = ''

  constructor(width: number) {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    this.ctx = canvas.getContext('2d')!
    this.texture = new CanvasTexture(canvas)
    this.texture.colorSpace = SRGBColorSpace
    const material = new MeshBasicMaterial({ map: this.texture, toneMapped: false })
    this.mesh = new Mesh(new PlaneGeometry(width, (width * HEIGHT) / WIDTH), material)
  }

  show(gear: number, kmh: number): void {
    const text = `${gear}|${kmh}`
    if (text === this.shown) return
    this.shown = text
    const ctx = this.ctx
    ctx.fillStyle = '#0c1711'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.fillStyle = '#7dffb0'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'italic 800 58px system-ui, sans-serif'
    ctx.fillText(String(gear), WIDTH / 2, 38)
    ctx.font = 'italic 700 18px system-ui, sans-serif'
    ctx.fillText(`${kmh} KM/H`, WIDTH / 2, 80)
    this.texture.needsUpdate = true
  }
}
