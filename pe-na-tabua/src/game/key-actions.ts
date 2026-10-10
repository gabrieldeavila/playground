import type { Mode } from './session'

export type Action = 'modes' | 'levels' | 'courses' | 'title' | 'select-up' | 'select-down' | 'race' | 'continue' | 'restart' | 'camera' | 'mute' | 'sound' | 'volume-down' | 'volume-up'

const CONFIRM = ['Enter', 'Space']
const UP = ['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA']
const DOWN = ['ArrowDown', 'ArrowRight', 'KeyS', 'KeyD']

// O que uma tecla faz em cada tela. C e M valem em qualquer uma.
export function actionFor(code: string, mode: Mode): Action | null {
  if (code === 'KeyC') return 'camera'
  if (code === 'KeyM') return 'mute'
  switch (mode) {
    case 'title':
      if (code === 'KeyO') return 'sound'
      return CONFIRM.includes(code) ? 'modes' : null
    case 'sound':
      return soundAction(code)
    case 'modes':
      return menuAction(code, 'levels', 'title')
    case 'levels':
      return menuAction(code, 'courses', 'modes')
    case 'courses':
      return menuAction(code, 'race', 'levels')
    case 'racing':
      if (code === 'KeyR') return 'restart'
      return code === 'Escape' ? 'courses' : null
    case 'results':
      if (CONFIRM.includes(code)) return 'continue'
      return code === 'KeyL' || code === 'Escape' ? 'levels' : null
  }
}

// Listas: setas escolhem, Enter confirma, Esc volta.
function menuAction(code: string, confirm: Action, back: Action): Action | null {
  if (CONFIRM.includes(code)) return confirm
  if (UP.includes(code)) return 'select-up'
  if (DOWN.includes(code)) return 'select-down'
  return code === 'Escape' ? back : null
}

// Som: cima/baixo escolhem o volume, esquerda/direita ajustam, Esc ou Enter voltam.
function soundAction(code: string): Action | null {
  if (code === 'ArrowUp' || code === 'KeyW') return 'select-up'
  if (code === 'ArrowDown' || code === 'KeyS') return 'select-down'
  if (code === 'ArrowLeft' || code === 'KeyA') return 'volume-down'
  if (code === 'ArrowRight' || code === 'KeyD') return 'volume-up'
  return code === 'Escape' || CONFIRM.includes(code) ? 'title' : null
}
