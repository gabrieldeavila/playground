import type { Input } from './sim/types'

type Bindings = Record<keyof Input, string>

// Usa event.code, então funciona igual em qualquer layout de teclado.
// Na campanha só tem um jogador: os dois jeitos de jogar valem ao mesmo tempo.
const BINDINGS: Bindings[] = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', crouch: 'KeyS', punch: 'KeyF', kick: 'KeyG', block: 'KeyH' },
  {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    crouch: 'ArrowDown',
    punch: 'KeyJ',
    kick: 'KeyK',
    block: 'KeyL',
  },
]

const BOUND_CODES = new Set([...BINDINGS.flatMap((b) => Object.values(b)), 'Enter', 'Escape', 'Space'])

export class Keyboard {
  private down = new Set<string>()
  // Teclas apertadas desde a última leitura (para menus: uma ação por aperto).
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

  read(): Input {
    const input = {} as Input
    for (const key of Object.keys(BINDINGS[0]) as (keyof Input)[]) {
      input[key] = BINDINGS.some((b) => this.down.has(b[key]))
    }
    return input
  }
}
