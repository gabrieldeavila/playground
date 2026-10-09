// Trecho da pista descrito em alto nível; vira vários segmentos.
export interface Section {
  enter: number // segmentos de transição na entrada
  hold: number
  leave: number // segmentos de transição na saída
  curve: number // curvatura alvo (1/m). Positivo = direita
  hill: number // variação total de altura no trecho (m)
}

// Visual da pista; o render traduz em céu, luz, cores do terreno e mar.
export type ThemeId = 'mountain' | 'coast'

// O que cresce na beira da estrada, e de que lado fica o mar.
export interface Scenery {
  treeChance: number // por segmento e lado
  nearTreeChance: number
  rockChance: number
  pineShare: number // fração das árvores que são pinheiros
  seaSide: -1 | 0 | 1 // lado em que o terreno desce para o mar (0 = sem mar)
}

// Pista em três partes: largada e chegada são sempre iguais; o miolo (body) se repete
// nos níveis mais altos para a pista crescer.
export interface Course {
  name: string
  seed: number
  theme: ThemeId
  scenery: Scenery
  start: Section[]
  body: Section[]
  finish: Section[] // reta da chegada mais a reta de escape (RUNOFF_LENGTH)
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

// rail = um lance de guard-rail; gantry = pórtico de placas por cima da pista.
export type PropKind = 'tree' | 'pine' | 'rock' | 'post' | 'sign' | 'rail' | 'gantry'

// Objeto de beira de estrada, em coordenadas de pista.
export interface Prop {
  kind: PropKind
  s: number // distância ao longo da pista (m)
  x: number // deslocamento lateral (m). Positivo = direita
  scale: number
  rotation: number
}

export interface Track {
  name: string
  theme: ThemeId
  scenery: Scenery
  segments: Segment[]
  points: CenterPoint[] // segments.length + 1 pontos
  props: Prop[] // ordenados por s
  length: number
  finishS: number
}
