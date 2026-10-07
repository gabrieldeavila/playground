// Trecho da pista descrito em alto nível; vira vários segmentos.
export interface Section {
  enter: number // segmentos de transição na entrada
  hold: number
  leave: number // segmentos de transição na saída
  curve: number // curvatura alvo (1/m). Positivo = direita
  hill: number // variação total de altura no trecho (m)
}

export interface Course {
  name: string
  seed: number
  sections: Section[]
}

export interface Segment {
  index: number
  curve: number
  y0: number
  y1: number
}

// Ponto da linha central no mundo, na borda entre dois segmentos.
export interface CenterPoint {
  x: number
  y: number
  z: number
  heading: number // 0 = olhando para -z; cresce virando à direita
}

export type PropKind = 'tree' | 'pine' | 'rock' | 'post' | 'sign'

// Objeto de beira de estrada, em coordenadas de pista.
export interface Prop {
  kind: PropKind
  s: number // distância ao longo da pista (m)
  x: number // deslocamento lateral (m). Positivo = direita
  scale: number
  rotation: number
}

export interface Track {
  segments: Segment[]
  points: CenterPoint[] // segments.length + 1 pontos
  props: Prop[] // ordenados por s
  length: number
  finishS: number
}
