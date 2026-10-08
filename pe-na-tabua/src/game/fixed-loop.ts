const STEP = 1 / 120
const MAX_FRAME = 0.1 // evita espiral de passos depois de a aba ficar em segundo plano

// Simulação em passo fixo; desenho uma vez por quadro.
export function startLoop(step: (dt: number) => void, frame: (dt: number) => void): void {
  let last = performance.now()
  let pending = 0
  const tick = (now: number) => {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000)
    last = now
    pending += elapsed
    while (pending >= STEP) {
      step(STEP)
      pending -= STEP
    }
    frame(elapsed)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
