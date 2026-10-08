// O painel é desenhado numa cena própria, com câmera fixa. A origem do painel
// fica no centro da borda de baixo da tela, a DISTANCE da câmera.
export const COCKPIT_FOV = 60
export const DISTANCE = 0.6
export const HALF_HEIGHT = DISTANCE * Math.tan((COCKPIT_FOV / 2) * (Math.PI / 180))

export const COWL_HALF_WIDTH = 0.6
export const COWL_DEPTH = 0.35

// Altura da borda de cima da carenagem em cada x.
export function cowlTop(x: number): number {
  return 0.215 - 0.17 * (x / COWL_HALF_WIDTH) ** 2
}
