// Uma nota da melodia: começa no passo `step` da barra e dura `steps` semicolcheias.
export interface LeadNote {
  step: number
  midi: number
  steps: number
}

// Uma barra = 16 semicolcheias. Padrões em texto, um caractere por passo:
// guitarra 'x' = abafada curta, 'X' = acorde aberto (cada '-' seguinte segura mais um passo), '.' = pausa.
// baixo 'x' = tônica, 'o' = oitava acima, '.' = pausa. Bateria 'x' = toca.
export interface Bar {
  root: number // midi da tônica do power chord (oitava da guitarra)
  guitar: string
  bass: string
  kick: string
  snare: string
  hat: string
  lead?: LeadNote[]
}

export interface Song {
  bpm: number
  bars: Bar[]
}

export interface StepNotes {
  kick: boolean
  snare: boolean
  hat: boolean
  bass: number | null
  guitar: { midi: number; steps: number; muted: boolean } | null
  lead: { midi: number; steps: number } | null
}
