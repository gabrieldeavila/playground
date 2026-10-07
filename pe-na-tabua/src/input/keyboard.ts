import type { RiderInput } from '../domain/race/types'

const KEYS = {
  throttle: ['ArrowUp', 'KeyW'],
  brake: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  punch: ['KeyJ', 'KeyZ'],
  kick: ['KeyK', 'KeyX'],
}

const BOUND_CODES = new Set([...Object.values(KEYS).flat(), 'Enter', 'Space'])

// Usa event.code, então funciona igual em qualquer layout de teclado.
export class Keyboard {
  private readonly down = new Set<string>()
  // Teclas apertadas desde a última leitura (uma ação por aperto nos menus).
  private presses: string[] = []

  constructor(target: Window) {
    target.addEventListener('keydown', (e) => {
      if (BOUND_CODES.has(e.code)) e.preventDefault()
      this.down.add(e.code)
      if (!e.repeat) this.presses.push(e.code)
    })
    target.addEventListener('keyup', (e) => this.down.delete(e.code))
    target.addEventListener('blur', () => this.down.clear())
  }

  takePresses(): string[] {
    const presses = this.presses
    this.presses = []
    return presses
  }

  read(): RiderInput {
    const held = (codes: string[]) => codes.some((code) => this.down.has(code))
    return {
      throttle: held(KEYS.throttle) ? 1 : 0,
      brake: held(KEYS.brake) ? 1 : 0,
      steer: (held(KEYS.right) ? 1 : 0) - (held(KEYS.left) ? 1 : 0),
      punch: held(KEYS.punch),
      kick: held(KEYS.kick),
    }
  }
}
