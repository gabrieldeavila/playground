import type { Section, Segment } from './types'

const easeIn = (a: number, b: number, t: number) => a + (b - a) * t * t
const easeInOut = (a: number, b: number, t: number) => a + (b - a) * (0.5 - Math.cos(t * Math.PI) / 2)

// Expande os trechos em segmentos com curva e altura suavizadas.
export function buildSegments(sections: Section[]): Segment[] {
  const segments: Segment[] = []
  let y = 0
  for (const section of sections) {
    const total = section.enter + section.hold + section.leave
    const startY = y
    const endY = startY + section.hill
    for (let i = 0; i < total; i++) {
      segments.push({
        index: segments.length,
        curve: curveAt(section, i),
        y0: easeInOut(startY, endY, i / total),
        y1: easeInOut(startY, endY, (i + 1) / total),
      })
    }
    y = endY
  }
  return segments
}

function curveAt(section: Section, i: number): number {
  if (i < section.enter) return easeIn(0, section.curve, i / section.enter)
  if (i < section.enter + section.hold) return section.curve
  return easeInOut(section.curve, 0, (i - section.enter - section.hold) / section.leave)
}
